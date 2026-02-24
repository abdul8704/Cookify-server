const axios = require("axios");
const OAuth = require("oauth-1.0a");
const crypto = require("crypto");
const { json } = require("stream/consumers");
const Ing = require('./models/Ingredient.model');
const connectDB = require('./config/db'); const BASE_URL = "https://platform.fatsecret.com/rest/server.api";

const CONSUMER_KEY = "f98d614e97f84984a49c522af9dd3516";
const CONSUMER_SECRET = "c168fa00fd58454583aa9f1c2190b1bb";

// ---------------- OAuth setup ----------------

const oauth = OAuth({
  consumer: { key: CONSUMER_KEY, secret: CONSUMER_SECRET },
  signature_method: "HMAC-SHA1",
  hash_function(base, key) {
    return crypto.createHmac("sha1", key).update(base).digest("base64");
  }
});

// ---------------- Core request ----------------

async function fatsecretRequest(params) {
  const requestData = {
    url: BASE_URL,
    method: "GET",
    data: params
  };

  const oauthParams = oauth.authorize(requestData);

  try {
    const res = await axios.get(BASE_URL, {
      params: { ...params, ...oauthParams },
      timeout: 10000
    });

    if (res.data?.error) {
      throw new Error(
        `${res.data.error.code}: ${res.data.error.message}`
      );
    }

    return res.data;
  } catch (err) {
    if (err.response) {
      console.error("HTTP:", err.response.status);
      console.error(JSON.stringify(err.response.data, null, 2));
    } else {
      console.error(err.message);
    }
    throw err;
  }
}

// ---------------- API calls ----------------

async function searchFoods(query, maxResults = 5) {
  const data = await fatsecretRequest({
    method: "foods.search",
    search_expression: query,
    max_results: maxResults,
    format: "json"
  });

  return data.foods?.food || [];
}

async function getFoodDetails(foodId) {
  const data = await fatsecretRequest({
    method: "food.get",
    food_id: foodId,
    format: "json"
  });

  return data.food || null;
}

// ---------------- Mapping logic ----------------

function slugify(str) {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

function normalizePer100g(serving) {
  const grams = Number(serving.metric_serving_amount);
  if (!grams || grams <= 0) return null;

  const factor = 100 / grams;
  const num = v => Math.round(v ? Number(v) * factor : 0);

  return {
    calories: num(serving.calories),
    macros: {
      protein: num(serving.protein),
      carbs: num(serving.carbohydrate),
      fat: num(serving.fat),
      fiber: num(serving.fiber)
    },
    micros: {
      iron: num(serving.iron),
      calcium: num(serving.calcium),
      magnesium: num(serving.magnesium),
      potassium: num(serving.potassium),
      vitaminA: num(serving.vitamin_a),
      vitaminC: num(serving.vitamin_c),
      vitaminD: num(serving.vitamin_d),
      sodium: num(serving.sodium),
      zinc: num(serving.zinc)
    }
  };
}

function mapFatSecretFoodToIngredient(food) {
  if (!food?.servings?.serving) return null;

  const servings = Array.isArray(food.servings.serving)
    ? food.servings.serving
    : [food.servings.serving];

  const gramServing = servings.find(
    s => s.metric_serving_unit === "g"
  );

  if (!gramServing) return null;

  const nutritionPer100g = normalizePer100g(gramServing);
  if (!nutritionPer100g) return null;

  return {
    name: food.food_name.trim(),
    slug: slugify(food.food_name),
    aliases: [
      food.food_name.toLowerCase(),
      ...(food.brand_name ? [food.brand_name.toLowerCase()] : [])
    ],
    category: "other",
    baseUnit: "g",
    nutritionPer100g,
    image: null,
    density: null
  };
}

// ---------------- Demo run ----------------

(async () => {
  try {
    await connectDB();
    console.log("Searching for: banana");

    const foods = await searchFoods("banana");
    if (!foods.length) {
      console.warn("No foods found");
      return;
    }

    let res = []

    for (const f of foods) {
      const food = await getFoodDetails(f.food_id);
      if (!food) continue;

      const ingredient = mapFatSecretFoodToIngredient(food);
      if (!ingredient) continue;

      res.push((ingredient))
    }
    const ops = res.map(item => ({
      updateOne: {
        filter: { slug: item.slug },
        update: { $set: item },
        upsert: true
      }
    }));
    const result = await Ing.bulkWrite(ops);
    console.log(`Successfully upserted data. Modified: ${result.modifiedCount}, Upserted: ${result.upsertedCount}`);
    process.exit(0);
  } catch (err) {
    console.error("🔥 Fatal:", err.message);
    process.exit(1);
  }
})();
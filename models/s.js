require("dotenv").config();
const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path"); // ✅ MISSING
const csv = require("csv-parser");
const slugify = require("slugify");
const Ingredient = require("./Ingredient.model.js");

// 🧠 Helpers
function toNumber(value) {
  if (!value) return 0;
  const num = parseFloat(value);
  return isNaN(num) ? 0 : num;
}

function cleanString(value) {
  if (!value) return "";
  return value.toString().trim().toLowerCase();
}

async function importCSV() {
  const results = [];

  const filePath = path.join(__dirname, "../daily_food_nutrition_dataset.csv");
  console.log("Reading from:", filePath);

  fs.createReadStream(filePath)
    .pipe(csv({
      mapHeaders: ({ header }) => cleanString(header)
    }))
    .on("data", (row) => {
  try {
    const name = cleanString(row["food_item"]);
    if (!name) return;

    const ingredient = {
      name,
      slug: slugify(name, { lower: true, strict: true }),
      aliases: [],
      category: cleanString(row["category"] || "other"),
      baseUnit: "g",

      nutritionPer100g: {
        calories: toNumber(row["calories (kcal)"]),

        macros: {
          protein: toNumber(row["protein (g)"]),
          carbs: toNumber(row["carbohydrates (g)"]),
          fat: toNumber(row["fat (g)"]),
          fiber: toNumber(row["fiber (g)"])
        },

        micros: {
          iron: 0,
          calcium: 0,
          magnesium: 0,
          potassium: 0,
          vitaminA: 0,
          vitaminC: 0,
          vitaminD: 0,
          zinc: 0
        }
      }
    };

    results.push(ingredient);

  } catch {
    console.log("Skipping malformed row");
  }
})
    .on("end", async () => {
      try {
        await Ingredient.bulkWrite(
          results.map(item => ({
            updateOne: {
              filter: { slug: item.slug },
              update: item,
              upsert: true
            }
          }))
        );

        console.log(`Inserted/Updated ${results.length} ingredients.`);
        process.exit();
      } catch (err) {
        console.error("Bulk insert failed:", err);
        process.exit(1);
      }
    });
}

// 🔌 Proper connection flow
async function start() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB connected");
    await importCSV(); // ✅ only after DB connection
  } catch (err) {
    console.error("Startup failed:", err);
    process.exit(1);
  }
}

start();

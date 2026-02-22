const fs = require("fs");
const XLSX = require("xlsx");

// ===== CONFIG =====
const INPUT_FILE = "./nutrition_db.xlsx";   // your xlsx file
const OUTPUT_FILE = "./ingredients.json";

// ===== HELPERS =====

// Convert NaN / undefined to 0
function safeNumber(value) {
  if (value === undefined || value === null) return 0;
  const num = Number(value);
  return isNaN(num) ? 0 : num;
}

// Extract bracket content and clean name
function extractNameAndAlias(name) {
  if (!name) return { cleanName: "", bracketAlias: null };

  const match = name.match(/\((.*?)\)/);

  let cleanName = name;
  let bracketAlias = null;

  if (match) {
    bracketAlias = match[1].trim().toLowerCase();
    cleanName = name.replace(/\(.*?\)/, "").trim();
  }

  return {
    cleanName: cleanName.toLowerCase(),
    bracketAlias
  };
}

// Parse aliases column
function parseAliases(value) {
  if (!value) return [];

  if (Array.isArray(value)) return value;

  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) return parsed.map(a => a.toLowerCase().trim());
    } catch (e) {
      return value.split(",").map(a => a.toLowerCase().trim());
    }
  }

  return [];
}

// Generate random sodium per 100g (0–0.8g)
function randomSodium() {
  return Number((Math.random() * 0.8).toFixed(3));
}

// ===== MAIN =====

function convert() {
  const workbook = XLSX.readFile(INPUT_FILE);
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];

  const rows = XLSX.utils.sheet_to_json(sheet);

  const transformed = rows.map(row => {
    const { cleanName, bracketAlias } = extractNameAndAlias(row.name);

    let aliases = parseAliases(row.aliases);

    // Add clean name and bracket alias
    if (cleanName) aliases.push(cleanName);
    if (bracketAlias) aliases.push(bracketAlias);

    // Remove duplicates
    aliases = [...new Set(aliases)];

    return {
      name: cleanName,
      slug: row.slug?.toString().toLowerCase().trim(),

      aliases,

      category: row.category || "other",
      baseUnit: row.baseUnit || "g",

      nutritionPer100g: {
        calories: safeNumber(row.calories),

        macros: {
          protein: safeNumber(row.protein),
          carbs: safeNumber(row.carbs),
          fat: safeNumber(row.fat),
          fiber: safeNumber(row.fiber)
        },

        micros: {
          iron: safeNumber(row.iron),
          calcium: safeNumber(row.calcium),
          magnesium: safeNumber(row.magnesium),
          potassium: safeNumber(row.potassium),

          vitaminA: safeNumber(row.vitaminA),
          vitaminC: safeNumber(row.vitaminC),
          vitaminD: safeNumber(row.vitaminD),

          sodium: randomSodium(),

          zinc: safeNumber(row.zinc)
        }
      },

      density: row.density !== undefined && !isNaN(row.density)
        ? Number(row.density)
        : null
    };
  });

  fs.writeFileSync(
    OUTPUT_FILE,
    JSON.stringify(transformed, null, 2)
  );

  console.log("Conversion complete.");
}

convert();
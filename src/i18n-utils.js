const fs = require("fs");
const path = require("path");

const mkdirp = require("mkdirp");

const {
  LutManager,
  lutToLanguageCodeHelper,
  randomChineseLutConverter,
} = require("./lut");

// TODO: Generate these files with babel too
const generateI18nFiles = (outputDir, sourceDir) => {
  const englishLut = LutManager.getLut();
  fs.appendFileSync(
    path.join(outputDir, sourceDir, "../public/locales/en", "en.json"),
    lutToLanguageCodeHelper(englishLut),
  );
};

module.exports = { generateI18nFiles };

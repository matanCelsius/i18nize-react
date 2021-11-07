const randChinese = require("randchinese");

const MAX_ITERATIONS = 1000;

let lut = {};
const paths = {};
const DEFAULT_MAX_LENGTH = 30;
let maxLength = DEFAULT_MAX_LENGTH;

const lutToLanguageCodeHelper = myLut => {
  const kvToCode = (key, value) =>
    `"${key}": "${value.replace(/(\r\n|\n|\r)/gm, "")}"`;
  const lines = Object.keys(myLut)
    .map(key => kvToCode(key, myLut[key]))
    .join(",\n");
  const template = `{${lines}}`;

  return template;
};

const randomChineseLutConverter = myLut =>
  Object.keys(myLut).reduce(
    (acc, next) => ({
      ...acc,
      [next]: randChinese(myLut[next].length),
    }),
    {},
  );

const LutManager = {
  getLut: () => lut,
  setLut: newLut => {
    lut = newLut;
  },
  getKeys: () =>
    Object.keys(lut).reduce((acc, next) => ({ ...acc, [next]: next }), {}),

  resetGetUniqueKeyFromFreeTextNumCalls: () => {
    LutManager.getUniqueKeyFromFreeTextNumCalls = 0;
  },
  incrementGetUniqueKeyFromFreeTextNumCalls: () => {
    LutManager.getUniqueKeyFromFreeTextNumCalls += 1;
  },

  // For testing
  clearLut: () => {
    lut = {};
  },
  setMaxLength: ml => {
    maxLength = ml;
  },
  clearMaxLength: () => {
    maxLength = DEFAULT_MAX_LENGTH;
  },
  addPath: programPath => {
    paths[programPath] = true;
  },
  isPathEffected: programPath => paths[programPath],
};

const getUniqueKeyFromFreeText = (text, fileName) => {
  LutManager.incrementGetUniqueKeyFromFreeTextNumCalls();
  let formattedFileName = fileName
    .substring(fileName.lastIndexOf("/") + 1)
    .replace(".tsx", "")
    .replace(/[A-Z]/g, m => "_" + m.toLowerCase())
    .toUpperCase()
    .substring(1);
  let maybeDuplicateKey = text
    .toUpperCase()
    .slice(0, maxLength)
    .replace(/[^a-zA-Z]+/g, " ")
    .trim()
    .replace(/[^a-zA-Z]/g, "_");
  maybeDuplicateKey = maybeDuplicateKey.length ? maybeDuplicateKey : "_";
  let key = `${formattedFileName}_${maybeDuplicateKey}`;
  for (let i = 1; i < MAX_ITERATIONS; i += 1) {
    if (lut[key] === text || lut[key] === undefined) break;
    key = `${maybeDuplicateKey}${i}`;
  }
  lut[key] = text;

  return key;
};

module.exports = {
  getUniqueKeyFromFreeText,
  LutManager,
  lutToLanguageCodeHelper,
  randomChineseLutConverter,
};

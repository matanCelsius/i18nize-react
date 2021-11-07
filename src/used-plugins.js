const parserPlugins = [
  "jsx",
  "classProperties", // '@babel/plugin-proposal-class-properties',
  "exportDefaultFrom",
  "optionalChaining",
  "typescript",
  "nullishCoalescingOperator",
  "dynamicImport",
];

const generatorOptions = {
  retainLines: true,
  retainFunctionParens: true,
};

module.exports = {
  parserPlugins,
  generatorOptions,
};

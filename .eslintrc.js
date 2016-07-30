module.exports = {
  'parser': 'babel-eslint',
  'parserOptions': {
    'sourceType': 'module',
    'allowImportExportEverywhere': false,
  },
  'root': true,
  'extends': 'lei/mocha',
  'rules': {
    'generator-star-spacing': 'off',
    'require-yield': 'off',
  },
};

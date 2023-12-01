module.exports = {
  env: {
    node: true,
    mocha: true,
  },
  extends: 'eslint:recommended',
  parserOptions: {
    "ecmaVersion": "latest",
  },
  // parserOptions is a MUST
  plugins: ['mocha'],
};

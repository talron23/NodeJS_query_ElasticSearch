module.exports = {
  env: {
    node: true,
    mocha: true,
  },
  extends: 'eslint:recommended',
  parserOptions: {
    "ecmaVersion": "latest",   // ecmaVersion need be set to latest, otherwise will alert on an error in our code
  },
  plugins: ['mocha'],
};

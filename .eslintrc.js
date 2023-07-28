module.exports = {
  parser: "@typescript-eslint/parser",
  plugins: ["@typescript-eslint"],
  extends: ["eslint:recommended", "plugin:@typescript-eslint/recommended"],
  rules: {
    "@typescript-eslint/no-var-requires": "",
  },
  env: {
    node: true, // Add this line to define the 'module' variable for Node.js environment
  },
};

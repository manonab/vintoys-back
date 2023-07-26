module.exports = {
  parser: "@typescript-eslint/parser",
  plugins: ["@typescript-eslint"],
  extends: ["eslint:recommended", "plugin:@typescript-eslint/recommended"],
  rules: {
    // Add any additional ESLint rules or overrides as needed
  },
  env: {
    node: true, // Add this line to define the 'module' variable for Node.js environment
  },
};

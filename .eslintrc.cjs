module.exports = {
    "root": true,
    "extends": "ego",
    "parserOptions": {
        "project": "tsconfig.json",
        "tsconfigRootDir": __dirname,
        "sourceType": "module",
    },
    "rules": {
        // Additional, per-project rules...
        "require-await": ["off"],
        "no-redeclare": ["off"]
    }
}
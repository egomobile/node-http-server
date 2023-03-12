if (!process.env.EGO_BRANCH_NAME) {
    console.log("Module version not updated");

    process.exit(0);
}

const fs = require("fs");
const path = require("path");

const packageJSONFile = path.join(__dirname, "package.json");

// load package.json
const packageJSON = JSON.parse(fs.readFileSync(packageJSONFile, "utf8"));

// environment variable
const branchName = process.env.EGO_BRANCH_NAME.toLowerCase().trim();

// update version from EGO_BRANCH_NAME
const versionParts = packageJSON.version.split(".");
const packageVersion = `${versionParts[0]}.${versionParts[1]}.${versionParts[2]}`;

packageJSON.version = `${packageVersion}-${branchName}.0`;

// update package.json
fs.writeFileSync(packageJSONFile, JSON.stringify(packageJSON, null, 2), "utf8");

console.log(`New module version is ${packageJSON.version}`);

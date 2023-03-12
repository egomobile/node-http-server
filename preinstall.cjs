const GITHUB_REF_NAME = process.env.GITHUB_REF_NAME?.trim();

if (!GITHUB_REF_NAME) {
    console.log("Module version not updated");

    process.exit(0);
}

const axios = require("axios");
const fs = require("node:fs");
const path = require("node:path");

const packageJSONFile = path.join(__dirname, "package.json");

// ########## environment variables ##########
const GITHUB_API_URL = process.env.GITHUB_API_URL?.trim();
if (!GITHUB_API_URL) {
    console.error("Cannot find environment variable GITHUB_API_URL");

    process.exit(2);
}

const GITHUB_REPOSITORY = process.env.GITHUB_REPOSITORY?.trim();
if (!GITHUB_REPOSITORY) {
    console.error("Cannot find environment variable GITHUB_REPOSITORY");

    process.exit(3);
}

const GITHUB_SHA = process.env.GITHUB_SHA?.trim();
if (!GITHUB_SHA) {
    console.error("Cannot find environment variable GITHUB_SHA");

    process.exit(4);
}
// ########## environment variables ##########

// ########## s. https://gist.github.com/yershalom/a7c08f9441d1aadb13777bce4c7cdc3b ##########
async function getFirstCommitHash() {
    const url = GITHUB_API_URL + "/repos/" + GITHUB_REPOSITORY + "/commits";

    console.log("Try get first commit hash in branch", GITHUB_REF_NAME, "via", url, "...");

    const response = await axios.get(url);
    const link = response.headers["link"];

    let firstCommit;

    if (link) {
        const pageUrl = link.split(",")[1].split(";")[0].split("<")[1].split(">")[0];
        const { data } = await axios.get(pageUrl);

        firstCommit = data;
    }
    else {
        firstCommit = response.data;
    }

    const firstCommitHash = firstCommit[firstCommit.length - 1]["sha"];
    console.log("First commit hash:", firstCommitHash);

    return firstCommit[firstCommit.length - 1]["sha"];
}

async function getTotalCommitCount() {
    const firstCommitHash = await getFirstCommitHash();
    const compareUrl = GITHUB_API_URL + "/repos/" + GITHUB_REPOSITORY + "/compare/" + firstCommitHash + "..." + GITHUB_SHA;

    console.log("Try get compare url for branch", GITHUB_REF_NAME, "via", compareUrl, "...");

    const { data } = await axios.get(compareUrl);

    const totalCommits = Number(data["total_commits"]);
    console.log("total_commits:", totalCommits);

    return totalCommits;
}
// ########## s. https://gist.github.com/yershalom/a7c08f9441d1aadb13777bce4c7cdc3b ##########

async function main() {
    const totalCommitCount = await getTotalCommitCount();
    const nextNr = totalCommitCount + 1;

    // load package.json
    const packageJSON = JSON.parse(fs.readFileSync(packageJSONFile, "utf8"));

    // environment variable
    const branchName = EGO_BRANCH_NAME.toLowerCase().trim();

    // update version from EGO_BRANCH_NAME
    const versionParts = packageJSON.version.split(".");
    const packageVersion = `${versionParts[0]}.${versionParts[1]}.${versionParts[2]}`;

    packageJSON.version = `${packageVersion}-${branchName}.${nextNr}`;

    // update package.json
    fs.writeFileSync(packageJSONFile, JSON.stringify(packageJSON, null, 2), "utf8");

    console.log(`New module version is ${packageJSON.version}`);
}

main().catch((error) => {
    console.error("[UNHANDLED ERROR]", error);

    process.exit(1);
});

module.exports = deprecatedCreatePullRequest;

const octokitCreatePullRequest = require("./lib/create-pull-request");

function deprecatedCreatePullRequest(octokit) {
  octokit.log.warn(
    "[octokit-plugin-create-pull-request] Default export is deprecated. Use 'const { createPullRequest} = require('octokit-plugin-create-pull-request')` instead"
  );
  octokit.createPullRequest = octokitCreatePullRequest.bind(null, octokit);
}

function createPullRequest(octokit) {
  octokit.createPullRequest = octokitCreatePullRequest.bind(null, octokit);
}

deprecatedCreatePullRequest.createPullRequest = createPullRequest;

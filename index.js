module.exports = octokitCreatePullRequest

const createPullRequest = require('./lib/create-pull-request')

function octokitCreatePullRequest (octokit) {
  octokit.createPullRequest = createPullRequest.bind(null, octokit)
}

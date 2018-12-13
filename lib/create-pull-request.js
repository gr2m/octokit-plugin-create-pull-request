module.exports = createPullRequest

async function createPullRequest (octokit, { owner, repo, title, body, base, head, changes }) {
  let response

  if (!base) {
    response = await octokit.repos.get({ owner, repo })
    base = response.data.default_branch
  }

  response = await octokit.repos.listCommits({
    owner,
    repo,
    sha: base,
    per_page: 1
  })
  let latestCommitSha = response.data[0].sha
  const treeSha = response.data[0].commit.tree.sha

  response = await octokit.git.createTree({
    owner,
    repo,
    base_tree: treeSha,
    tree: Object.keys(changes.files).map(path => {
      return {
        path,
        mode: '100644',
        content: changes.files[path]
      }
    })
  })
  const newTreeSha = response.data.sha

  response = await octokit.git.createCommit({
    owner,
    repo,
    message: changes.commit,
    tree: newTreeSha,
    parents: [latestCommitSha]
  })
  latestCommitSha = response.data.sha

  await octokit.git.createRef({
    owner,
    repo,
    sha: latestCommitSha,
    ref: `refs/heads/${head}`
  })

  response = await octokit.pulls.create({
    owner,
    repo,
    head,
    base,
    title,
    body
  })
}

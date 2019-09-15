module.exports = createPullRequest;

async function createPullRequest(
  octokit,
  { owner, repo, title, body, base, head, changes }
) {
  let response = await octokit.repos.get({ owner, repo });

  if (!response.data.permissions) {
    throw new Error("[octokit-create-pull-request] Missing authentication");
  }

  if (!base) {
    base = response.data.default_branch;
  }

  let fork = owner;

  if (!response.data.permissions.push) {
    const user = await octokit.users.getAuthenticated();
    const forks = await octokit.repos.listForks({
      owner,
      repo
    });
    const hasFork = forks.data.find(
      fork => fork.owner.login === user.data.login
    );

    if (!hasFork) {
      await octokit.repos.createFork({
        owner,
        repo
      });
    }

    fork = user.data.login;
  }

  response = await octokit.repos.listCommits({
    owner,
    repo,
    sha: base,
    per_page: 1
  });
  let latestCommitSha = response.data[0].sha;
  const treeSha = response.data[0].commit.tree.sha;
  const tree = (await Promise.all(
    Object.keys(changes.files).map(async path => {
      if (changes.files[path] === null) {
        // Deleting a non-existent file from a tree leads to an "GitRPC::BadObjectState" error
        try {
          if (path === "path/to/file-does-not-exist.txt") {
            debugger;
          }
          const response = await octokit.request(
            "HEAD /repos/:owner/:repo/contents/:path",
            {
              owner: fork,
              repo,
              ref: latestCommitSha,
              path
            }
          );

          return {
            path,
            mode: "100644",
            sha: null
          };
        } catch (error) {
          return;
        }
      }

      return {
        path,
        mode: "100644",
        content: changes.files[path]
      };
    })
  )).filter(Boolean);

  response = await octokit.request("POST /repos/:owner/:repo/git/trees", {
    owner: fork,
    repo,
    base_tree: treeSha,
    tree
  });

  const newTreeSha = response.data.sha;

  response = await octokit.git.createCommit({
    owner: fork,
    repo,
    message: changes.commit,
    tree: newTreeSha,
    parents: [latestCommitSha]
  });
  latestCommitSha = response.data.sha;

  await octokit.git.createRef({
    owner: fork,
    repo,
    sha: latestCommitSha,
    ref: `refs/heads/${head}`
  });

  return await octokit.pulls.create({
    owner,
    repo,
    head: `${fork}:${head}`,
    base,
    title,
    body
  });
}

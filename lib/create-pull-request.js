module.exports = createPullRequest;

async function createPullRequest(
  octokit,
  { owner, repo, title, body, base, head, changes }
) {
  // https://developer.github.com/v3/repos/#get-a-repository
  let response = await octokit.request("GET /repos/:owner/:repo", {
    owner,
    repo,
  });

  if (!response.data.permissions) {
    throw new Error("[octokit-create-pull-request] Missing authentication");
  }

  if (!base) {
    base = response.data.default_branch;
  }

  let fork = owner;

  if (!response.data.permissions.push) {
    // https://developer.github.com/v3/users/#get-the-authenticated-user
    const user = await octokit.request("GET /user");
    
    // https://developer.github.com/v3/repos/forks/#list-forks
    const forks = await octokit.request("GET /repos/:owner/:repo/forks", {
      owner,
      repo,
    });
    const hasFork = forks.data.find(
      (fork) => fork.owner.login === user.data.login
    );

    if (!hasFork) {
      // https://developer.github.com/v3/repos/forks/#create-a-fork
      await octokit.request("POST /repos/:owner/:repo/forks", {
        owner,
        repo,
      });
    }

    fork = user.data.login;
  }

  // https://developer.github.com/v3/repos/commits/#list-commits-on-a-repository
  response = await octokit.request("GET /repos/:owner/:repo/commits", {
    owner,
    repo,
    sha: base,
    per_page: 1,
  });
  let latestCommitSha = response.data[0].sha;
  const treeSha = response.data[0].commit.tree.sha;
  const tree = (
    await Promise.all(
      Object.keys(changes.files).map(async (path) => {
        if (changes.files[path] === null) {
          // Deleting a non-existent file from a tree leads to an "GitRPC::BadObjectState" error
          try {
            // https://developer.github.com/v3/repos/contents/#get-contents
            const response = await octokit.request(
              "HEAD /repos/:owner/:repo/contents/:path",
              {
                owner: fork,
                repo,
                ref: latestCommitSha,
                path,
              }
            );

            return {
              path,
              mode: "100644",
              sha: null,
            };
          } catch (error) {
            return;
          }
        }

        return {
          path,
          mode: "100644",
          content: changes.files[path],
        };
      })
    )
  ).filter(Boolean);

  // https://developer.github.com/v3/git/trees/#create-a-tree
  response = await octokit.request("POST /repos/:owner/:repo/git/trees", {
    owner: fork,
    repo,
    base_tree: treeSha,
    tree,
  });

  const newTreeSha = response.data.sha;

  // https://developer.github.com/v3/git/commits/#create-a-commit
  response = await octokit.request("POST /repos/:owner/:repo/git/commits", {
    owner: fork,
    repo,
    message: changes.commit,
    tree: newTreeSha,
    parents: [latestCommitSha],
  });
  latestCommitSha = response.data.sha;

  // https://developer.github.com/v3/git/refs/#create-a-reference
  await octokit.request("POST /repos/:owner/:repo/git/refs", {
    owner: fork,
    repo,
    sha: latestCommitSha,
    ref: `refs/heads/${head}`,
  });

  // https://developer.github.com/v3/pulls/#create-a-pull-request
  return await octokit.request("POST /repos/:owner/:repo/pulls", {
    owner,
    repo,
    head: `${fork}:${head}`,
    base,
    title,
    body,
  });
}

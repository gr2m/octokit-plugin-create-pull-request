import type { Octokit } from "@octokit/core";
import type { Endpoints } from "@octokit/types";

type TreeParameter = Endpoints["POST /repos/:owner/:repo/git/trees"]["parameters"]["tree"];

type Options = {
  owner: string;
  repo: string;
  title: string;
  body: string;
  head: string;
  base?: string;
  changes: Changes;
};

type Changes = {
  files: {
    [path: string]: string | File | UpdateFunction;
  };
  commit: string;
};

// https://developer.github.com/v3/git/blobs/#parameters
type File = {
  content: string;
  encoding: "utf-8" | "base64";
};

type UpdateFunctionFile = {
  size: number;
  encoding: "base64";
  content: string;
};

type UpdateFunction = (file: UpdateFunctionFile) => string | File;

export async function octokitCreatePullRequest(
  octokit: Octokit,
  { owner, repo, title, body, base, head, changes }: Options
) {
  // https://developer.github.com/v3/repos/#get-a-repository
  const { data: repository } = await octokit.request(
    "GET /repos/:owner/:repo",
    {
      owner,
      repo,
    }
  );

  if (!repository.permissions) {
    throw new Error(
      "[octokit-plugin-create-pull-request] Missing authentication"
    );
  }

  if (!base) {
    base = repository.default_branch;
  }

  let fork = owner;

  if (!repository.permissions.push) {
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
  const {
    data: [firstCommit],
  } = await octokit.request("GET /repos/:owner/:repo/commits", {
    owner,
    repo,
    sha: base,
    per_page: 1,
  });
  const treeSha = firstCommit.commit.tree.sha;

  const tree = (
    await Promise.all(
      Object.keys(changes.files).map(async (path) => {
        const value = changes.files[path];

        if (value === null) {
          // Deleting a non-existent file from a tree leads to an "GitRPC::BadObjectState" error,
          // so we only attempt to delete the file if it exists.
          try {
            // https://developer.github.com/v3/repos/contents/#get-contents
            await octokit.request("HEAD /repos/:owner/:repo/contents/:path", {
              owner: fork,
              repo,
              ref: firstCommit.sha,
              path,
            });

            return {
              path,
              mode: "100644",
              sha: null,
            };
          } catch (error) {
            return;
          }
        }

        // When passed a function, retrieve the content of the file, pass it
        // to the function, then return the result
        if (typeof value === "function") {
          const { data: file } = await octokit.request(
            "GET /repos/:owner/:repo/contents/:path",
            {
              owner: fork,
              repo,
              ref: firstCommit.sha,
              path,
            }
          );

          const result = await value(file as UpdateFunctionFile);
          return valueToTreeObject(octokit, owner, repo, path, result);
        }

        return valueToTreeObject(octokit, owner, repo, path, value);
      })
    )
  ).filter(Boolean) as TreeParameter;

  // https://developer.github.com/v3/git/trees/#create-a-tree
  const {
    data: { sha: newTreeSha },
  } = await octokit.request("POST /repos/:owner/:repo/git/trees", {
    owner: fork,
    repo,
    base_tree: treeSha,
    tree,
  });

  // https://developer.github.com/v3/git/commits/#create-a-commit
  const {
    data: { sha: latestCommitSha },
  } = await octokit.request("POST /repos/:owner/:repo/git/commits", {
    owner: fork,
    repo,
    message: changes.commit,
    tree: newTreeSha,
    parents: [firstCommit.sha],
  });

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

async function valueToTreeObject(
  octokit: Octokit,
  owner: string,
  repo: string,
  path: string,
  value: string | File
) {
  // Text files can be changed through the .content key
  if (typeof value === "string") {
    return {
      path,
      mode: "100644",
      content: value,
    };
  }

  // Binary files need to be created first using the git blob API,
  // then changed by referencing in the .sha key
  const { data } = await octokit.request("POST /repos/:owner/:repo/git/blobs", {
    owner,
    repo,
    ...value,
  });
  const blobSha = data.sha;
  return {
    path,
    mode: "100644",
    sha: blobSha,
  };
}

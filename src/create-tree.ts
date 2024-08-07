import { Changes, State, TreeParameter, UpdateFunctionFile } from "./types.js";

import { valueToTreeObject } from "./value-to-tree-object.js";
import { DELETE_FILE } from "./constants.js";

export async function createTree(
  state: Required<State>,
  changes: Required<Changes>,
): Promise<string | null> {
  const {
    octokit,
    owner,
    repo,
    ownerOrFork,
    latestCommitSha,
    latestCommitTreeSha,
  } = state;

  let tree = [];

  for (const path of Object.keys(changes.files)) {
    const value = changes.files[path];

    if (value === DELETE_FILE) {
      // Deleting a non-existent file from a tree leads to an "GitRPC::BadObjectState" error,
      // so we only attempt to delete the file if it exists.
      try {
        // https://developer.github.com/v3/repos/contents/#get-contents
        await octokit.request("HEAD /repos/{owner}/{repo}/contents/:path", {
          owner: ownerOrFork,
          repo,
          ref: latestCommitSha,
          path,
        });

        tree.push({
          path,
          mode: "100644",
          sha: null,
        });
        continue;
      } catch (error) {
        continue;
      }
    }

    // When passed a function, retrieve the content of the file, pass it
    // to the function, then return the result
    if (typeof value === "function") {
      let result;

      try {
        const { data: file } = await octokit.request(
          "GET /repos/{owner}/{repo}/contents/:path",
          {
            owner: ownerOrFork,
            repo,
            ref: latestCommitSha,
            path,
          },
        );

        result = await value(
          Object.assign(file, { exists: true }) as UpdateFunctionFile,
        );

        if (result === DELETE_FILE) {
          try {
            // https://developer.github.com/v3/repos/contents/#get-contents
            await octokit.request("HEAD /repos/{owner}/{repo}/contents/:path", {
              owner: ownerOrFork,
              repo,
              ref: latestCommitSha,
              path,
            });

            tree.push({
              path,
              mode: "100644",
              sha: null,
            });
            continue;
            /* v8 ignore next 3 */
          } catch (error) {
            continue;
          }
        }
      } catch (error) {
        /* v8 ignore next 2 */
        // @ts-expect-error
        if (error.status !== 404) throw error;

        // @ts-ignore
        result = await value({ exists: false });
      }

      if (
        result === null ||
        typeof result === "undefined" ||
        typeof result === "symbol"
      ) {
        continue;
      }

      tree.push(
        // @ts-expect-error - Argument result can never be of type Symbol at this branch
        // because the above condition will catch it and move on to the next iteration cycle
        await valueToTreeObject(octokit, ownerOrFork, repo, path, result),
      );
      continue;
    }

    // @ts-expect-error - Argument value can never be of type Symbol at this branch
    // because the above condition will catch it and initiate a file deletion operation
    tree.push(await valueToTreeObject(octokit, ownerOrFork, repo, path, value));
    continue;
  }

  tree = tree.filter(Boolean) as TreeParameter;

  if (tree.length === 0) {
    return null;
  }

  // https://developer.github.com/v3/git/trees/#create-a-tree
  const {
    data: { sha: newTreeSha },
  } = await octokit.request("POST /repos/{owner}/{repo}/git/trees", {
    owner: ownerOrFork,
    repo,
    base_tree: latestCommitTreeSha,
    tree,
  });

  return newTreeSha;
}

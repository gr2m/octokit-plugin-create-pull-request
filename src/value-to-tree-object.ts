import type { Octokit } from "@octokit/core";
import type { File } from "./types";

export async function valueToTreeObject(
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
  const { data } = await octokit.request(
    "POST /repos/{owner}/{repo}/git/blobs",
    {
      owner,
      repo,
      ...value,
    }
  );
  const blobSha = data.sha;
  return {
    path,
    mode: "100644",
    sha: blobSha,
  };
}

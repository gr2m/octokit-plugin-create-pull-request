import type { Octokit } from "@octokit/core";
import type { File } from "./types.js";

export async function valueToTreeObject(
  octokit: Octokit,
  owner: string,
  repo: string,
  path: string,
  value: string | File,
) {
  const defaultMode = "100644";

  // Text files can be changed through the .content key
  if (typeof value === "string") {
    return {
      path,
      mode: defaultMode,
      content: value,
    };
  }

  const mode = value.mode ?? defaultMode;

  // UTF-8 files can be treated as text files
  // https://github.com/gr2m/octokit-plugin-create-pull-request/pull/133
  if (value.encoding === "utf-8") {
    return {
      path,
      mode: mode,
      content: value.content,
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
    },
  );
  const blobSha = data.sha;

  return {
    path,
    mode: mode,
    sha: blobSha,
  };
}

import type { Changes, State } from "./types";

export async function createCommit(
  state: Required<State>,
  changes: Changes
): Promise<string> {
  const { octokit, repo, fork, latestCommitSha } = state;

  // https://developer.github.com/v3/git/commits/#create-a-commit
  const { data: latestCommit } = await octokit.request(
    "POST /repos/:owner/:repo/git/commits",
    {
      owner: fork,
      repo,
      message: changes.commit,
      tree: state.latestCommitTreeSha,
      parents: [latestCommitSha],
    }
  );

  return latestCommit.sha;
}

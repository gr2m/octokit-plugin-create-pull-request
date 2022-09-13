import type { Changes, State } from "./types";

export async function createCommit(
  state: Required<State>,
  treeCreated: boolean,
  changes: Changes
): Promise<string> {
  const { octokit, repo, ownerOrFork, latestCommitSha } = state;

  const message = treeCreated
    ? changes.commit
    : typeof changes.emptyCommit === "string"
    ? changes.emptyCommit
    : changes.commit;

  // https://developer.github.com/v3/git/commits/#create-a-commit
  const { data: latestCommit } = await octokit.request(
    "POST /repos/{owner}/{repo}/git/commits",
    {
      owner: ownerOrFork,
      repo,
      message,
      tree: state.latestCommitTreeSha,
      parents: [latestCommitSha],
    }
  );

  return latestCommit.sha;
}

import type { Octokit } from "@octokit/core";
import type { Options, State } from "./types";

import { createTreeAndCommit } from "./create-tree-and-commit";

export async function octokitCreatePullRequest(
  octokit: Octokit,
  { owner, repo, title, body, base, head, changes: changesOption }: Options
) {
  const changes = Array.isArray(changesOption)
    ? changesOption
    : [changesOption];

  if (changes.length === 0)
    throw new Error(
      '[octokit-plugin-create-pull-request] "changes" cannot be an empty array'
    );

  const state: State = { octokit, owner, repo };

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

  state.fork = owner;

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

    state.fork = user.data.login;
  }

  // https://developer.github.com/v3/repos/commits/#list-commits-on-a-repository
  const {
    data: [latestCommit],
  } = await octokit.request("GET /repos/:owner/:repo/commits", {
    owner,
    repo,
    sha: base,
    per_page: 1,
  });
  state.latestCommitSha = latestCommit.sha;
  state.latestCommitTreeSha = latestCommit.commit.tree.sha;

  for (const change of changes) {
    await createTreeAndCommit(state as Required<State>, change);
  }

  // https://developer.github.com/v3/git/refs/#create-a-reference
  await octokit.request("POST /repos/:owner/:repo/git/refs", {
    owner: state.fork,
    repo,
    sha: state.latestCommitSha,
    ref: `refs/heads/${head}`,
  });

  // https://developer.github.com/v3/pulls/#create-a-pull-request
  return await octokit.request("POST /repos/:owner/:repo/pulls", {
    owner,
    repo,
    head: `${state.fork}:${head}`,
    base,
    title,
    body,
  });
}

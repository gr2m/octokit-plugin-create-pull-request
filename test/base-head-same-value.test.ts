import { Octokit as Core } from "@octokit/core";
import { createPullRequest } from "../src";

const Octokit = Core.plugin(createPullRequest);

test("Base and Head equality", async () => {
  const octokit = new Octokit();

  try {
    await octokit.createPullRequest({
      owner: "gr2m",
      repo: "pull-request-test",
      title: "One comes, one goes",
      body: "because",
      base: "patch",
      head: "patch",
      changes: {
        files: {
          "path/to/file1.txt": "Content for file1",
          "path/to/file2.txt": "Content for file2",
        },
        commit: "why",
      },
    });
    throw new Error("Should not resolve");
  } catch (error) {
    expect((error as Error).message).toEqual(
      '[octokit-plugin-create-pull-request] "head" cannot be the same value as "base"'
    );
  }
});

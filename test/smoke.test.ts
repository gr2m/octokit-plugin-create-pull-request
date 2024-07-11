import { Octokit } from "@octokit/core";

import { createPullRequest, composeCreatePullRequest } from "../src";

describe("Smoke test", () => {
  it("createPullRequest is a function", () => {
    expect(createPullRequest).toBeInstanceOf(Function);
  });

  it("composeCreatePullRequest is a function", () => {
    expect(composeCreatePullRequest).toBeInstanceOf(Function);
  });

  it("createPullRequest.VERSION is set", () => {
    expect(createPullRequest.VERSION).toEqual("0.0.0-development");
  });

  it("Loads plugin", () => {
    const TestOctokit = Octokit.plugin(createPullRequest);
    const testOctokit = new TestOctokit();
    expect(testOctokit.createPullRequest).toBeInstanceOf(Function);
  });

  it("throws error if `changes` is an empty array", async () => {
    const TestOctokit = Octokit.plugin(createPullRequest);
    const testOctokit = new TestOctokit();
    expect(async () => {
      return testOctokit.createPullRequest({
        owner: "owner",
        repo: "repo",
        title: "Test",
        head: "test",
        body: "",
        changes: [],
      });
    }).rejects.toThrow(
      new Error(
        '[octokit-plugin-create-pull-request] "changes" cannot be an empty array',
      ),
    );
  });
});

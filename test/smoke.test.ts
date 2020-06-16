import { Octokit } from "@octokit/core";

import { createPullRequest } from "../src";

describe("Smoke test", () => {
  it("is a function", () => {
    expect(createPullRequest).toBeInstanceOf(Function);
  });

  it("createPullRequest.VERSION is set", () => {
    expect(createPullRequest.VERSION).toEqual("0.0.0-development");
  });

  it("Loads plugin", () => {
    const TestOctokit = Octokit.plugin(createPullRequest);
    const testOctokit = new TestOctokit();
    expect(testOctokit.createPullRequest).toBeInstanceOf(Function);
  });
});

import { Octokit as Core } from "@octokit/core";

import { createPullRequest } from "../src";
const Octokit = Core.plugin(createPullRequest);

test("use fork", async () => {
  const fixtures = require("./fixtures/use-fork");
  const octokit = new Octokit();

  octokit.hook.wrap("request", (_, options) => {
    const currentFixtures = fixtures.shift();
    const {
      baseUrl,
      method,
      url,
      request,
      headers,
      mediaType,
      draft,
      ...params
    } = options;

    expect(currentFixtures.request.method).toEqual(options.method);
    expect(currentFixtures.request.url).toEqual(options.url);

    Object.keys(params).forEach((paramName) => {
      expect(params[paramName]).toStrictEqual(
        currentFixtures.request[paramName]
      );
    });
    return currentFixtures.response;
  });

  await octokit.createPullRequest({
    owner: "gr2m",
    repo: "pull-request-test",
    title: "Fork has already been created",
    body: "because",
    head: "test-branch-rlbes",
    changes: {
      files: {
        "path/to/file1.txt": "Content for file1",
        "path/to/file2.txt": "Content for file2",
      },
      commit: "why",
    },
  });

  expect(fixtures.length).toEqual(0);
});

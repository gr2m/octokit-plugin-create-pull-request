import { Octokit as Core } from "@octokit/core";
import { RequestError } from "@octokit/request-error";

import { createPullRequest } from "../src";

const Octokit = Core.plugin(createPullRequest);

test("create fork", async () => {
  const fixtures = require("./fixtures/create-fork");
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

    expect(
      `${currentFixtures.request.method} ${currentFixtures.request.url}`,
    ).toEqual(`${options.method} ${options.url}`);

    Object.keys(params).forEach((paramName) => {
      expect(currentFixtures.request[paramName]).toStrictEqual(
        params[paramName],
      );
    });

    if (currentFixtures.response.status >= 400) {
      throw new RequestError("Error", currentFixtures.response.status, {
        request: currentFixtures.request,
        headers: currentFixtures.response.headers,
      });
    }

    return currentFixtures.response;
  });

  await octokit.createPullRequest({
    owner: "gr2m",
    repo: "pull-request-test",
    title: "One comes, one goes",
    body: "because",
    head: "test-branch-u7es0",
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

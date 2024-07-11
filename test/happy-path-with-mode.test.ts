import { Octokit as Core } from "@octokit/core";
import { RequestError } from "@octokit/request-error";

import { createPullRequest } from "../src";
const Octokit = Core.plugin(createPullRequest);

test("happy path with mode", async () => {
  const fixtures = require("./fixtures/happy-path-with-mode");
  const fixturePr = fixtures[fixtures.length - 1].response;
  const octokit = new Octokit();

  octokit.hook.wrap("request", (_, options) => {
    const currentFixtures = fixtures.shift();
    const { baseUrl, method, url, request, headers, mediaType, ...params } =
      options;

    expect(
      `${currentFixtures.request.method} ${currentFixtures.request.url}`,
    ).toEqual(`${options.method} ${options.url}`);

    Object.keys(params).forEach((paramName) => {
      expect(params[paramName]).toEqual(currentFixtures.request[paramName]);
    });

    if (currentFixtures.response.status >= 400) {
      throw new RequestError("Error", currentFixtures.response.status, {
        request: currentFixtures.request,
        headers: currentFixtures.response.headers,
      });
    }

    return currentFixtures.response;
  });

  const pr = await octokit.createPullRequest({
    owner: "gr2m",
    repo: "pull-request-test",
    title: "One comes, one goes",
    body: "because",
    head: "happy-path-with-mode",
    changes: {
      files: {
        "path/to/file1.txt": "Content for file1",
        "path/to/file2.sh": {
          content: "echo Hello World",
          encoding: "utf-8",
          mode: "100755",
        },
      },
      commit: "why",
    },
  });

  expect(pr).toStrictEqual(fixturePr);
  expect(fixtures.length).toEqual(0);
});

import { Octokit as Core } from "@octokit/core";

import { createPullRequest } from "../src";
const Octokit = Core.plugin(createPullRequest);

test("use fork blob", async () => {
  const fixtures = require("./fixtures/use-fork-blob");
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

    console.log(`${options.method} ${options.url}`, params);
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
        "path/to/1x1-black.gif": {
          // https://css-tricks.com/snippets/html/base64-encode-of-1x1px-transparent-gif/
          content: "R0lGODlhAQABAIAAAAUEBAAAACwAAAAAAQABAAACAkQBADs=",
          encoding: "base64",
        },
      },
      commit: "why",
    },
  });

  expect(fixtures.length).toEqual(0);
});

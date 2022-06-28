import { Octokit as Core } from "@octokit/core";
import { RequestError } from "@octokit/request-error";

import { createPullRequest } from "../src";
const Octokit = Core.plugin(createPullRequest);

test("pull-request-exists", async () => {
  const fixtures = require("./fixtures/pull-request-exists");
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
      `${currentFixtures.request.method} ${currentFixtures.request.url}`
    ).toEqual(`${options.method} ${options.url}`);

    Object.keys(params).forEach((paramName) => {
      expect(currentFixtures.request[paramName]).toStrictEqual(
        params[paramName]
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

  try {
    await octokit.createPullRequest({
      owner: "gr2m",
      repo: "pull-request-test",
      title: "One comes, one goes",
      body: "because",
      head: "pull-request-exists",
      changes: {
        files: {
          "file1.txt": "Content for file1",
        },
        commit: "why",
      },
    });
    throw new Error("Should not resolve");
  } catch (error) {
    expect(error.message).toEqual(
      "[octokit-plugin-create-pull-request] Pull request already exists: https://github.com/gr2m/pull-request-test/pull/99. Set update=true to enable updating"
    );
  }

  expect(fixtures.length).toEqual(0);
});

import { test, expect } from "vitest";
import { Octokit as Core } from "@octokit/core";
import { RequestError } from "@octokit/request-error";

import { readFile } from "node:fs/promises";

import { createPullRequest } from "../src/index.ts";

const Octokit = Core.plugin(createPullRequest);

test("create fork", async () => {
  const fixtures = JSON.parse(
    await readFile(
      new URL("./fixtures/create-fork.json", import.meta.url),
      "utf-8",
    ),
  );
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
        response: currentFixtures.response,
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

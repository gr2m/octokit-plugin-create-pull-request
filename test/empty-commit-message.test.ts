import { test, expect } from "vitest";
import { Octokit as Core } from "@octokit/core";
import { RequestError } from "@octokit/request-error";

import { readFile } from "node:fs/promises";

import { createPullRequest } from "../src/index.ts";
const Octokit = Core.plugin(createPullRequest);

test("Empty commit message", async () => {
  const fixtures = JSON.parse(
    await readFile(
      new URL("./fixtures/empty-commit-message.json", import.meta.url),
      "utf-8",
    ),
  );
  const fixturePr = fixtures[fixtures.length - 1].response;
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

  const pr = await octokit.createPullRequest({
    owner: "gr2m",
    repo: "pull-request-test",
    title: "Empty commit message",
    head: "empty-commit-message",
    body: "",
    changes: [
      {
        files: {
          "foo.txt": "bar",
        },
        commit: "foo.txt created",
      },
      {
        files: {
          "test.txt": () => null,
        },
        emptyCommit: "test.txt not updated",
        commit: "test.txt updated",
      },
    ],
  });

  expect(pr).toStrictEqual(fixturePr);
  expect(fixtures.length).toEqual(0);
});

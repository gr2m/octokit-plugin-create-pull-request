import { test, expect } from "vitest";
import { Octokit as Core } from "@octokit/core";
import { RequestError } from "@octokit/request-error";

import { readFile } from "node:fs/promises";

import { createPullRequest } from "../src/index.ts";
const Octokit = Core.plugin(createPullRequest);

test("use fork blob", async () => {
  const fixtures = JSON.parse(
    await readFile(
      new URL("./fixtures/use-fork-blob.json", import.meta.url),
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

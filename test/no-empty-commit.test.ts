import { Octokit as Core } from "@octokit/core";
import { RequestError } from "@octokit/request-error";

import { readFile } from "node:fs/promises";

import { createPullRequest } from "../src/index.ts";
const Octokit = Core.plugin(createPullRequest);

test("no empty commit", async () => {
  const fixtures = JSON.parse(
    await readFile(
      new URL("./fixtures/no-empty-commit.json", import.meta.url),
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
        response: currentFixtures.response,
        request: currentFixtures.request,
      });
    }

    return currentFixtures.response;
  });

  const pr = await octokit.createPullRequest({
    owner: "gr2m",
    repo: "pull-request-test",
    title: "No empty commits",
    head: "no-empty-commits",
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
        emptyCommit: false,
        commit: "empty update",
      },
    ],
  });

  expect(pr).toStrictEqual(fixturePr);
  expect(fixtures.length).toEqual(0);
});

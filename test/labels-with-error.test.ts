import { Octokit as Core } from "@octokit/core";
import { RequestError } from "@octokit/request-error";

import { readFile } from "node:fs/promises";

import { createPullRequest } from "../src/index.ts";
const Octokit = Core.plugin(createPullRequest);

test("labels without error", async () => {
  const fixtures = JSON.parse(
    await readFile(
      new URL("./fixtures/labels-with-error.json", import.meta.url),
      "utf-8",
    ),
  );
  const fixturePr = fixtures[fixtures.length - 2].response;
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

  expect(async () => {
    return octokit.createPullRequest({
      owner: "gr2m",
      repo: "pull-request-test",
      title: "One comes, one goes",
      body: "because",
      labels: ["enhancement", "help wanted"],
      head: "with-labels",
      changes: {
        files: {
          "path/to/file1.txt": "Content for file1",
          "path/to/file2.txt": "Content for file2",
        },
        commit: "why",
      },
    });
  }).rejects.toThrow(new Error("Error"));
});

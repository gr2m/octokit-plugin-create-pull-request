import { Octokit as Core } from "@octokit/core";
import { RequestError } from "@octokit/request-error";

import { readFile } from "node:fs/promises";

import { createPullRequest } from "../src/index.ts";
import { UpdateFunction } from "../src/types.ts";
const Octokit = Core.plugin(createPullRequest);

test("update readme", async () => {
  const fixtures = JSON.parse(
    await readFile(
      new URL("./fixtures/update-readme.json", import.meta.url),
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

  const updateReadme: UpdateFunction = ({ exists, encoding, content }) => {
    if (!exists) return null;

    return Buffer.from(content, encoding).toString("utf-8").toUpperCase();
  };

  const pr = await octokit.createPullRequest({
    owner: "gr2m",
    repo: "pull-request-test",
    title: "Uppercase README content",
    head: "uppercase-readme",
    body: "",
    changes: {
      files: {
        "README.md": updateReadme,
        "readme.md": updateReadme,
      },
      commit: "uppercase README content",
    },
  });

  expect(pr).toStrictEqual(fixturePr);
  expect(fixtures.length).toEqual(0);
});

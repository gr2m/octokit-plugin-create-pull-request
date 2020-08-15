import { Octokit as Core } from "@octokit/core";
import { RequestError } from "@octokit/request-error";

import { createPullRequest } from "../src";
import { UpdateFunction } from "../src/types";
const Octokit = Core.plugin(createPullRequest);

test("update readme", async () => {
  const fixtures = require("./fixtures/update-readme");
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
    draft: false,
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

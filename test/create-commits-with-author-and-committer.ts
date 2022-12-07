import { Octokit as Core } from "@octokit/core";
import { RequestError } from "@octokit/request-error";

import { createPullRequest } from "../src";
const Octokit = Core.plugin(createPullRequest);

test("author and committer", async () => {
  const fixtures = require("./fixtures/create-commits-with-author-and-comitter");
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

  const pr = await octokit.createPullRequest({
    owner: "gr2m",
    repo: "sandbox",
    title: "One comes, one goes",
    body: "because",
    head: "test-branch-tv12s",
    changes: [
      {
        files: {
          "path/to/file1.txt": "Content for file1",
          "path/to/file2.txt": "Content for file2",
        },
        author: {
          name: "Author LastName",
          email: "Author.LastName@acme.com",
          date: new Date().toISOString(),
        },
        committer: {
          name: "Committer LastName",
          email: "Committer.LastName@acme.com",
          date: new Date().toISOString(),
        },
        commit: "why",
      },
      {
        files: {
          "path/to/file1.txt": "New content",
          "path/to/file4.txt": "Content for file4",
        },
        committer: {
          name: "Committer Smith",
          email: "Committer.Smith@acme.com",
          date: new Date().toISOString(),
        },
        commit: "Make a fix",
      },
    ],
  });

  expect(pr).toStrictEqual(fixturePr);
  expect(fixtures.length).toEqual(0);
});

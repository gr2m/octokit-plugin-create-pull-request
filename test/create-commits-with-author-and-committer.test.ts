import { Octokit as Core } from "@octokit/core";
import { RequestError } from "@octokit/request-error";

import { readFile } from "node:fs/promises";

import { createPullRequest } from "../src/index.ts";
const Octokit = Core.plugin(createPullRequest);

test("author and committer", async () => {
  const fixtures = JSON.parse(
    await readFile(
      new URL(
        "./fixtures/create-commits-with-author-and-committer.json",
        import.meta.url,
      ),
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
      if (paramName === "signature") {
        expect(currentFixtures.request.verification.signature).toStrictEqual(
          "my-signature",
        );
        return;
      }
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
          date: "2022-12-06T19:58:39.672Z",
        },
        committer: {
          name: "Committer LastName",
          email: "Committer.LastName@acme.com",
          date: "2022-12-06T19:58:39.672Z",
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
          date: "2022-12-06T19:58:39.672Z",
        },
        signature: () => "my-signature",
        commit: "Make a fix",
      },
    ],
  });

  expect(pr).toStrictEqual(fixturePr);
  expect(fixtures.length).toEqual(0);
});

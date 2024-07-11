import { vi, test, expect } from "vitest";
import { Octokit as Core } from "@octokit/core";
import { RequestError } from "@octokit/request-error";

import { readFile } from "node:fs/promises";

import { createPullRequest } from "../src/index.ts";
import { UpdateFunction } from "../src/types.ts";
const Octokit = Core.plugin(createPullRequest);

test("file functions are called in sequence", async () => {
  const fixtures = JSON.parse(
    await readFile(
      new URL("./fixtures/update-readme.json", import.meta.url),
      "utf-8",
    ),
  );
  const fixturePr = fixtures[fixtures.length - 1].response;
  const octokit = new Octokit();

  octokit.hook.wrap("request", () => {
    const currentFixtures = fixtures.shift();

    if (currentFixtures.response.status >= 400) {
      throw new RequestError("Error", currentFixtures.response.status, {
        request: currentFixtures.request,
        response: currentFixtures.response,
      });
    }

    return currentFixtures.response;
  });

  const fileOneStub = vi.fn();
  const fileTwoStub = vi.fn();

  const pr = await octokit.createPullRequest({
    owner: "gr2m",
    repo: "pull-request-test",
    title: "One comes, one goes",
    body: "because",
    head: "happy-path",
    changes: {
      files: {
        "path/to/file1.txt": async () => {
          expect(fileOneStub.mock.calls).toHaveLength(0);
          expect(fileTwoStub.mock.calls).toHaveLength(0);

          fileOneStub();

          // Delay execution till next event loop phase
          // to ensure file functions are called in sequence
          await new Promise((resolve) => setTimeout(resolve, 0));

          expect(fileOneStub.mock.calls).toHaveLength(1);
          expect(fileTwoStub.mock.calls).toHaveLength(0);
          return "";
        },
        "path/to/file2.txt": async () => {
          expect(fileOneStub.mock.calls).toHaveLength(1);
          expect(fileTwoStub.mock.calls).toHaveLength(0);

          fileTwoStub();

          expect(fileOneStub.mock.calls).toHaveLength(1);
          expect(fileTwoStub.mock.calls).toHaveLength(1);
          return "";
        },
      },
      commit: "uppercase README content",
    },
  });

  expect(pr).toStrictEqual(fixturePr);
  expect(fixtures.length).toEqual(0);
});

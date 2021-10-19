import { Octokit as Core } from "@octokit/core";
import { createPullRequest } from "../src";
const Octokit = Core.plugin(createPullRequest);

test("happy path with mode", async () => {
  const fixtures = require("./fixtures/happy-path-with-mode");
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
      ...params
    } = options;

    expect(options.method).toEqual(currentFixtures.request.method);
    expect(options.url).toEqual(currentFixtures.request.url);

    Object.keys(params).forEach((paramName) => {
      expect(params[paramName]).toEqual(currentFixtures.request[paramName]);
    });
    return currentFixtures.response;
  });

  const pr = await octokit.createPullRequest({
    owner: "kennethzfeng",
    repo: "pull-request-test",
    title: "One comes, one goes",
    body: "because",
    head: "patch",
    changes: {
      files: {
        "path/to/file1.txt": "Content for file1",
        "path/to/file2.txt": {
          content: "Content for file2",
          encoding: "utf-8",
        },
        "path/to/file3.sh": {
          content: "echo Hello World",
          encoding: "utf-8",
          mode: "100755",
        },
      },
      commit: "why",
    },
  });

  expect(pr).toStrictEqual(fixturePr);
  expect(fixtures.length).toEqual(0);
});

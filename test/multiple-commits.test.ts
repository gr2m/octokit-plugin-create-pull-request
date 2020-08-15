import { Octokit as Core } from "@octokit/core";
import { createPullRequest } from "../src";
const Octokit = Core.plugin(createPullRequest);

test("multiple commits", async () => {
  const fixtures = require("./fixtures/multiple-commits");
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

    expect(currentFixtures.request.method).toEqual(options.method);
    expect(currentFixtures.request.url).toEqual(options.url);

    Object.keys(params).forEach((paramName) => {
      expect(currentFixtures.request[paramName]).toStrictEqual(
        params[paramName]
      );
    });
    return currentFixtures.response;
  });

  const pr = await octokit.createPullRequest({
    owner: "gr2m",
    repo: "pull-request-test",
    title: "Test",
    head: "multiple-commits",
    body: "",
    draft: false,
    changes: [
      {
        files: {
          foo: "foo",
        },
        commit: "foo",
      },
      {
        files: {
          bar: "bar",
        },
        commit: "bar",
      },
    ],
  });

  expect(pr).toStrictEqual(fixturePr);
  expect(fixtures.length).toEqual(0);
});

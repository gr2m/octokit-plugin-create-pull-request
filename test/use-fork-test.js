const { test } = require("tap");

const Octokit = require("@octokit/rest").plugin(require(".."));

test("create fork", async t => {
  const fixtures = require("./fixtures/use-fork");
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

    t.equal(currentFixtures.request.method, options.method);
    t.equal(currentFixtures.request.url, options.url);

    Object.keys(params).forEach(paramName => {
      t.deepEqual(currentFixtures.request[paramName], params[paramName]);
    });
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
        "path/to/file1.txt": "Content for file1",
        "path/to/file2.txt": "Content for file2"
      },
      commit: "why"
    }
  });

  t.equal(fixtures.length, 0);
});

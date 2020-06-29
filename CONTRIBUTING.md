# Contributing

Please note that this project is released with a [Contributor Code of Conduct][coc].
By participating in this project you agree to abide by its terms.

## Running tests

All tests can be run with `npm test`. To run a single test, you can execute the test files directly with node, e.g.

```
node test/happy-path-test.js
```

or with the `tap` binary for nicer output.

```
npx tap test/happy-path-test.js
```

## Update test fixtures

Here is a script that records fixtures and logs them to stdout. Run with `GITHUB_TOKEN=... node my-script.js`. [Create token with repo scope](https://github.com/settings/tokens/new?scopes=repo)

```js
// my-script.js
const { Octokit } = require("@octokit/core");
const createPullRequest = require(".");
const MyOctokit = Octokit.plugin(createPullRequest);
const octokit = new MyOctokit({
  auth: process.env.GITHUB_TOKEN,
});

const fixtures = [];
octokit.hook.after("request", (response, options) => {
  fixtures.push({
    request: options,
    response,
  });
});
octokit.hook.error("request", (error, options) => {
  fixtures.push({
    request: options,
    response: {
      status: error.status,
      headers: error.headers,
      data: {
        error: error.message,
        documentation_url: error.documentation_url,
      },
    },
  });

  throw error;
});

octokit
  .createPullRequest({
    owner: "gr2m",
    repo: "sandbox",
    title: "One comes, one goes",
    body: "because",
    head: "test-branch-" + Math.random().toString(36).substr(2, 5),
    changes: {
      files: {
        "path/to/file1.txt": "Content for file1",
        "path/to/file2.txt": "Content for file2",
      },
      commit: "why",
    },
  })

  .then(() => {
    fixtures.forEach((fixture) => {
      if (fixture.request.headers.authorization) {
        fixture.request.headers.authorization = "token secret";
      }
    });
    console.log(JSON.stringify(fixtures, null, 2));
  });
```

[coc]: ./CODE_OF_CONDUCT.md

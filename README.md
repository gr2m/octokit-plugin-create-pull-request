# octokit-create-pull-request

> Octokit plugin to create a pull request with multiple file changes

[![@latest](https://img.shields.io/npm/v/octokit-create-pull-request.svg)](https://www.npmjs.com/package/octokit-create-pull-request)
[![Build Status](https://travis-ci.com/gr2m/octokit-create-pull-request.svg?branch=master)](https://travis-ci.com/gr2m/octokit-create-pull-request)
[![Greenkeeper](https://badges.greenkeeper.io/gr2m/octokit-create-pull-request.svg)](https://greenkeeper.io/)

Features

- Retrieves the repository’s default branch unless `base` branch is set
- Makes multiple file changes using a single commit
- Creates a fork if the authenticated user does not have write access to the repository
- See [Todos](#todos) for more cool feature ideas! Pull requests welcome!

## Usage

Update or create two files with a single commit

```js
const { Octokit } = require("@octokit/core");
const createPullRequest = require("octokit-create-pull-request");

const MyOctokit = Octokit.plugin(createPullRequest);

const TOKEN = "secret123"; // token needs "repo" scope
const octokit = new MyOctokit({
  auth: TOKEN
});

// Returns a normal Octokit PR response
// See https://octokit.github.io/rest.js/#octokit-routes-pulls-create
octokit
  .createPullRequest({
    owner: "repo-name",
    repo: "repo-name",
    title: "pull request title",
    body: "pull request description",
    base: "master" /* optional: defaults to default branch */,
    head: "pull-request-branch-name",
    changes: {
      files: {
        "path/to/file1.txt": "Content for file1",
        "path/to/file2.txt": null // deletes file if it exists
      },
      commit: "creating file1.txt & file2.txt"
    }
  })
  .then(pr => console.log(pr.data.number));
```

You can create a personal access token with the `repo` scope at https://github.com/settings/tokens/new?scopes=repo

## Todos

- **Editing files** based on current content  
  Add support to pass a function as file content, the function will be called with the current file content, if present.
- **Multiple commits**  
  Split up changes among multiple edits
- **Binary files**  
  Allow to create / edit files with binary content

## LICENSE

[MIT](LICENSE)

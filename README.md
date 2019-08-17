# octokit-create-pull-request

> Octokit plugin to create a pull request with multiple file changes

[![@latest](https://img.shields.io/npm/v/octokit-create-pull-request.svg)](https://www.npmjs.com/package/octokit-create-pull-request)
[![Build Status](https://travis-ci.com/gr2m/octokit-create-pull-request.svg?branch=master)](https://travis-ci.com/gr2m/octokit-create-pull-request)
[![Coverage Status](https://coveralls.io/repos/github/gr2m/octokit-create-pull-request/badge.svg)](https://coveralls.io/github/gr2m/octokit-create-pull-request)
[![Greenkeeper](https://badges.greenkeeper.io/gr2m/octokit-create-pull-request.svg)](https://greenkeeper.io/)

Features

- Retrieves the repository’s default branch unless `base` branch is set
- Makes multiple file changes using a single commit
- Creates a fork if the authenticated user does not have write access to the repository
- See [Todos](#todos) for more cool feature ideas! Pull requests welcome!

## Usage

Update or create two files with a single commit

```js
const Octokit = require('@octokit/rest')
  .plugin(require('octokit-create-pull-request'))

const octokit = new Octokit()

// Returns a normal Octokit PR response
// See https://octokit.github.io/rest.js/#octokit-routes-pulls-create
octokit.createPullRequest({
  owner: 'repo-name',
  repo: 'repo-name',
  title: 'pull request title',
  body: 'pull request description',
  base: 'master', /* optional: defaults to default branch */
  head: 'pull-request-branch-name',
  changes: {
    files: {
      'path/to/file1.txt': 'Content for file1',
      'path/to/file2.txt': 'Content for file2'
    },
    commit: 'creating file1.txt & file2.txt'
  }
}).then(pr => console.log(pr.data.number))
```

## Todos

- **Deleting files**  
  The challenge with deleting files is that the [`base_tree` parameter](https://developer.github.com/v3/git/trees/#create-a-tree) cannot be used, meaning the entire tree has to be retrieved, changed, and sent again.
- **Editing files** based on current content  
  Add support to pass a function as file content, the function will be called with the current file content, if present.
- **Multiple commits**  
  Split up changes among multiple edits

## LICENSE

[MIT](LICENSE)

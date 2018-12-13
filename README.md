# 🚧 THIS IS WORK IN PROGRESS 🚧

See [#1](https://github.com/gr2m/octokit-create-pull-request/pull/1) for the work-in-progress implementation

# octokit-create-pull-request

> Octokit plugin to create a pull request with multiple file changes

Features

- Creates a fork if necessary
- Retrieves the repository’s default branch unless `base` branch is set
- Makes multiple file changes using a single commit

## Usage

Update or create two files with a single commit

```js
const Octokit = require('@octokit/rest')
  .plugin(require('octokit-create-pull-request'))

const octokit = new Octokit()

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
})
```

## Todos

- **Deleting files**  
  The challenge with deleting files is hat the [`base_tree` parameter](https://developer.github.com/v3/git/trees/#create-a-tree) cannot be used, meaning the entire tree has to be retrieved, changed, and sent again.
- **Editing files** based on current content  
  Add support to pass a function as file content, the function will be called with the current file content, if present.
- **Multiple commits**  
  Split up changes among multiple edits

## LICENSE

[MIT](LICENSE)

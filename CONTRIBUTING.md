# Contributing

Please note that this project is released with a [Contributor Code of Conduct][coc].
By participating in this project you agree to abide by its terms.

## Update test fixtures

Here is a script that records fixtures and logs them to stdout

```js
const TOKEN = process.env.TOKEN
const { Octokit } = require('@octokit/core')
const createPullRequest = require('.')
const MyOctokit = Octokit.plugin(createPullRequest)()
const octokit = new MyOctokit({
  auth: TOKEN
})


const fixtures = []
octokit.hook.after('request', (response, options) => {
  fixtures.push({
    request: options,
    response
  })
})

octokit.authenticate({
  type: 'token',
  token: process.env.GITHUB_TOKEN
})

octokit.createPullRequest({
  owner: 'gr2m',
  repo: 'pull-request-test',
  title: 'One comes, one goes',
  body: 'because',
  head: 'test-branch-' + Math.random().toString(36).substr(2, 5),
  changes: {
    files: {
      'path/to/file1.txt': 'Content for file1',
      'path/to/file2.txt': 'Content for file2'
    },
    commit: 'why'
  }
})

  .then(() => {
    fixtures.forEach(fixture => {
      if (fixture.request.headers.authorization) {
        fixture.request.headers.authorization = 'token secret'
      }
    })
    console.log(JSON.stringify(fixtures, null, 2))
  })
```

[coc]: ./CODE_OF_CONDUCT.md

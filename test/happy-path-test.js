const { test } = require('tap')

const Octokit = require('@octokit/rest')
  .plugin(require('..'))

test('happy path', async t => {
  const fixtures = require('./fixtures/happy-path')
  const octokit = new Octokit()

  octokit.hook.wrap('request', (_, options) => {
    const currentFixtures = fixtures.shift()
    const { baseUrl, method, url, request, headers, mediaType, ...params } = options

    t.equal(currentFixtures.request.method, options.method)
    t.equal(currentFixtures.request.url, options.url)

    Object.keys(params).forEach(paramName => {
      t.deepEqual(currentFixtures.request[paramName], params[paramName])
    })
    return currentFixtures.response
  })

  await octokit.createPullRequest({
    owner: 'gr2m',
    repo: 'pull-request-test',
    title: 'One comes, one goes',
    body: 'because',
    head: 'patch',
    changes: {
      files: {
        'path/to/file1.txt': 'Content for file1',
        'path/to/file2.txt': 'Content for file2'
      },
      commit: 'why'
    }
  })

  t.equal(fixtures.length, 0)
})

// const Octokit = require('@octokit/rest')
//   .plugin(octokitCreatePullRequest)
//
// const octokit = new Octokit()
//
// octokit.hook.before('request', options => console.log(`${options.method} ${options.url}`))
//
// octokit.authenticate({
//   type: 'token',
//   token: process.env.GITHUB_TOKEN
// })
//
// octokit.createPullRequest({
//   owner: 'gr2m',
//   repo: 'pull-request-test',
//   title: 'One comes, one goes',
//   body: 'because',
//   head: 'test-branch-' + Math.random().toString(36).substr(2, 5),
//   changes: {
//     files: {
//       'path/to/file1.txt': 'Content for file1',
//       'path/to/file2.txt': 'Content for file2'
//     },
//     commit: 'why'
//   }
// })

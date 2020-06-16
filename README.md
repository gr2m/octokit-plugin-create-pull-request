# octokit-plugin-create-pull-request

> Octokit plugin to create a pull request with multiple file changes

[![@latest](https://img.shields.io/npm/v/octokit-plugin-create-pull-request.svg)](https://www.npmjs.com/package/octokit-plugin-create-pull-request)
[![Build Status](https://travis-ci.com/gr2m/octokit-plugin-create-pull-request.svg?branch=master)](https://travis-ci.com/gr2m/octokit-plugin-create-pull-request)

Features

- Retrieves the repository’s default branch unless `base` branch is set
- Makes multiple file changes using a single commit
- Creates a fork if the authenticated user does not have write access to the
  repository
- See [Todos](#todos) for more cool feature ideas! Pull requests welcome!

## Usage

## Usage

<table>
<tbody valign=top align=left>
<tr><th>
Browsers
</th><td width=100%>

Load `octokit-plugin-create-pull-request` and [`@octokit/core`](https://github.com/octokit/core.js) (or core-compatible module) directly from [cdn.pika.dev](https://cdn.pika.dev)

```html
<script type="module">
  import { Octokit } from "https://cdn.pika.dev/@octokit/core";
  import { createPullRequest } from "https://cdn.pika.dev/octokit-plugin-create-pull-request";
</script>
```

</td></tr>
<tr><th>
Node
</th><td>

Install with `npm install @octokit/core octokit-plugin-create-pull-request`. Optionally replace `@octokit/core` with a core-compatible module

```js
const { Octokit } = require("@octokit/core");
const { createPullRequest } = require("octokit-plugin-create-pull-request");
```

</td></tr>
</tbody>
</table>

```js
const MyOctokit = Octokit.plugin(createPullRequest);

const TOKEN = "secret123"; // token needs "repo" scope
const octokit = new MyOctokit({
  auth: TOKEN,
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
        "path/to/file2.png": {
          content: "_base64_encoded_content_",
          encoding: "base64",
        },
        "path/to/file3.txt": null, // deletes file if it exists
      },
      commit: "creating file1.txt, file2.png and deleting file3.txt",
    },
  })
  .then((pr) => console.log(pr.data.number));
```

You can create a personal access token with the `repo` scope at
https://github.com/settings/tokens/new?scopes=repo

## Todos

- **Editing files** based on current content  
  Addsupporttopassafunctionasfilecontent,thefunctionwillbecalledwiththecurrentfilecontent,ifpresent.
- **Multiple commits**  
  Splitupchangesamongmultipleedits

## LICENSE

[MIT](LICENSE)

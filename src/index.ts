import type { Octokit } from "@octokit/core";

import { octokitCreatePullRequest } from "./create-pull-request";
import { VERSION } from "./version";

/**
 * @param octokit Octokit instance
 */
export function createPullRequest(octokit: Octokit) {
  return {
    createPullRequest: octokitCreatePullRequest.bind(null, octokit),
  };
}

createPullRequest.VERSION = VERSION;

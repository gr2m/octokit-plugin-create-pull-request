import type { Octokit } from "@octokit/core";

import { composeCreatePullRequest } from "./compose-create-pull-request.js";
import { VERSION } from "./version.js";
export { DELETE_FILE } from "./constants.js";
import type * as Types from "./types.js";

/**
 * @param octokit Octokit instance
 */
export function createPullRequest(octokit: Octokit) {
  return {
    createPullRequest: composeCreatePullRequest.bind(null, octokit),
  };
}

export { composeCreatePullRequest } from "./compose-create-pull-request.js";

createPullRequest.VERSION = VERSION;

export namespace createPullRequest {
  export type Options = Types.Options;
  export type Changes = Types.Changes;
  export type File = Types.File;
  export type UpdateFunctionFile = Types.UpdateFunctionFile;
  export type UpdateFunction = Types.UpdateFunction;
}

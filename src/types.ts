import type { Octokit } from "@octokit/core";
import type { Endpoints } from "@octokit/types";

export type TreeParameter = Endpoints["POST /repos/:owner/:repo/git/trees"]["parameters"]["tree"];

export type Options = {
  owner: string;
  repo: string;
  title: string;
  body: string;
  head: string;
  base?: string;
  changes: Changes | Changes[];
};

export type Changes = {
  files: {
    [path: string]: string | File | UpdateFunction;
  };
  commit: string;
};

// https://developer.github.com/v3/git/blobs/#parameters
export type File = {
  content: string;
  encoding: "utf-8" | "base64";
};

export type UpdateFunctionFile = {
  size: number;
  encoding: "base64";
  content: string;
};

export type UpdateFunction = (file: UpdateFunctionFile) => string | File;

export type State = {
  octokit: Octokit;
  owner: string;
  repo: string;
  fork?: string;
  latestCommitSha?: string;
  latestCommitTreeSha?: string;
  treeSha?: string;
};

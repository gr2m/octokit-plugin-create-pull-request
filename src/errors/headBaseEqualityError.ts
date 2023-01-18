export class HeadBaseEqualityError extends Error {
  constructor() {
    super(
      "[octokit-plugin-create-pull-request] head cannot be the same value as base"
    );
  }
}

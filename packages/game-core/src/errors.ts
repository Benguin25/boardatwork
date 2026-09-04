export class InvalidDateKeyError extends Error {
  constructor(key: string) {
    super(`Invalid date key: "${key}" (expected YYYY-MM-DD)`);
    this.name = "InvalidDateKeyError";
  }
}

export class InvalidChallengeCodeError extends Error {
  constructor(reason: string) {
    super(`Invalid challenge code: ${reason}`);
    this.name = "InvalidChallengeCodeError";
  }
}

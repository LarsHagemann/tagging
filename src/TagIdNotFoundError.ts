export class TagIdNotFoundError extends Error {
  constructor(tag: string) {
    super(`Tag not found: ${tag}`);
    this.name = "TagIdNotFoundError";
  }
}

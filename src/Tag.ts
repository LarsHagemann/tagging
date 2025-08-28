export class Tag {
  public readonly key: string;

  constructor(key: string) {
    this.key = key;
  }
};

export class MetaTag {
  public readonly key: string;
  public readonly value: string;

  constructor(key: string, value: string) {
    this.key = key;
    this.value = value;
  }
};

export class TrueTag {};

export class OrTag {
  public readonly left: Filter;
  public readonly right: Filter;

  constructor(left: Filter, right: Filter) {
    this.left = left;
    this.right = right;
  }
};

export class NotTag {
  public readonly inner: Filter;

  constructor(inner: Filter) {
    this.inner = inner;
  }
};

export class AndTag {
  public readonly left: Filter;
  public readonly right: Filter;

  constructor(left: Filter, right: Filter) {
    this.left = left;
    this.right = right;
  }
}

export type Filter = Tag | MetaTag | TrueTag | OrTag | AndTag | NotTag;

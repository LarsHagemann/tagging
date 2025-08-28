import { Optional } from "./Optional";

export class Trie<Data> {
  private readonly currentPrefix: string;
  private readonly children: Trie<Data>[];
  private data?: Data;

  constructor(prefix?: string) {
    this.currentPrefix = prefix || "";
    this.children = [];
  }

  public insert(key: string, value: Data): void {
    if (key === this.currentPrefix || key === "") {
      this.data = value;
      return;
    }

    const child = this.children.find(c => c.currentPrefix === key.substring(0, 1));
    if (!child) {
      const newChild = new Trie<Data>(key.substring(0, 1));
      this.children.push(newChild);
      newChild.insert(key.substring(1), value);
    }
    else {
      child.insert(key.substring(1), value);
    }
  }

  public lookup(key: string): Optional<Data> {
    if (key === this.currentPrefix || key === "") {
      return new Optional(this.data);
    }

    const nextChild = this.children.find(c => c.currentPrefix === key.substring(0, 1));
    if (nextChild) {
      return nextChild.lookup(key.substring(1));
    }

    return new Optional<Data>(undefined);
  }
}

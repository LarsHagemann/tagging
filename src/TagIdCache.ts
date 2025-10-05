import { MetaTag, Tag } from "./Tag";
import { TagIdNotFoundError } from "./TagIdNotFoundError";
import { Trie } from "./Trie";

export class TagIdCache {
  private readonly tagTrie: Trie<string> = new Trie<string>();

  private tagToString(tag: Tag | MetaTag): string {
    if (tag instanceof Tag) {
      return tag.key;
    } else {
      return `${tag.key}:${tag.value}`;
    }
  }

  public tagToTagId(tag: Tag | MetaTag): string {
    const id = this.tagTrie.lookup(this.tagToString(tag));

    if (!id.isPresent()) {
      throw new TagIdNotFoundError(this.tagToString(tag));
    }

    return id.get();
  }

  public init(
    tags: {
      tag: Tag | MetaTag;
      tagId: string;
    }[]
  ) {
    tags.forEach(({ tag, tagId }) => {
      this.onTagAdded(tag, tagId);
    });
  }

  public onTagAdded(tag: Tag | MetaTag, tagId: string): void {
    const tagName = this.tagToString(tag);
    if (tagName) {
      this.tagTrie.insert(tagName, tagId);
    }
  }
}

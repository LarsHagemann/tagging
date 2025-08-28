import { describe, expect, it } from "vitest";
import { TagIdCache } from "../../src/TagIdCache";
import { Tag } from "../../src/Tag";

describe('TagIdCache', () => {
  it('throws for empty trie', async () => {
    const cache = new TagIdCache();
    await expect(new Promise(resolve => resolve(cache.tagToTagId(new Tag('tag1'))))).rejects.toThrow('Tag not found: tag1');
  });

  it('Correctly finds tags in trie', async () => {
    const cache = new TagIdCache();
    cache.onTagAdded(new Tag('tag1'), '1');
    cache.onTagAdded(new Tag('tag2'), '2');
    cache.onTagAdded(new Tag('tag3'), '3');
    cache.onTagAdded(new Tag('tag1tag'), '4');

    await expect(new Promise(resolve => resolve(cache.tagToTagId(new Tag('tag1'))))).resolves.toEqual('1');
    await expect(new Promise(resolve => resolve(cache.tagToTagId(new Tag('tag2'))))).resolves.toEqual('2');
    await expect(new Promise(resolve => resolve(cache.tagToTagId(new Tag('tag3'))))).resolves.toEqual('3');
    await expect(new Promise(resolve => resolve(cache.tagToTagId(new Tag('tag1tag'))))).resolves.toEqual('4');
  });
});

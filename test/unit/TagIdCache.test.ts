import { describe, expect, it } from "vitest";
import { TagIdCache } from "../../src/TagIdCache";
import { MetaTag, Tag } from "../../src/Tag";

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

  it('correctly inserts and retrieves MetaTags', () => {
    const cache = new TagIdCache();
    cache.onTagAdded(new MetaTag('key', 'value'), '42');

    expect(cache.tagToTagId(new MetaTag('key', 'value'))).toEqual('42');
  });

  it('throws for MetaTag not in cache', () => {
    const cache = new TagIdCache();
    expect(() => cache.tagToTagId(new MetaTag('key', 'value'))).toThrow('Tag not found: key:value');
  });

  it('overwrites tagId on duplicate insertion', () => {
    const cache = new TagIdCache();
    cache.onTagAdded(new Tag('tag1'), '1');
    cache.onTagAdded(new Tag('tag1'), '99');

    expect(cache.tagToTagId(new Tag('tag1'))).toEqual('99');
  });

  it('correctly stores and retrieves a tag with an empty key', () => {
    const cache = new TagIdCache();
    cache.onTagAdded(new Tag(''), 'empty');

    expect(cache.tagToTagId(new Tag(''))).toEqual('empty');
  });

  it('does not collide a tag with the one formed by doubling its last char', () => {
    const cache = new TagIdCache();
    cache.onTagAdded(new Tag('cs'), '1');
    cache.onTagAdded(new Tag('css'), '2');
    cache.onTagAdded(new Tag('fre'), '3');
    cache.onTagAdded(new Tag('free'), '4');

    expect(cache.tagToTagId(new Tag('cs'))).toEqual('1');
    expect(cache.tagToTagId(new Tag('css'))).toEqual('2');
    expect(cache.tagToTagId(new Tag('fre'))).toEqual('3');
    expect(cache.tagToTagId(new Tag('free'))).toEqual('4');
  });
});

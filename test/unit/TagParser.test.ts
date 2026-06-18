import { describe, expect, it } from "vitest";
import { TagParser } from "../../src/TagParser";
import { AndTag, MetaTag, NotTag, OrTag, Tag, TrueTag } from "../../src/Tag";

describe('TagParser', () => {
  it('correctly creates a filter from an empty string', () => {
    const parser = new TagParser('');

    expect(parser.parse()).toEqual(new TrueTag());
  });

  it('correctly parses a tag', () => {
    const parser = new TagParser('abcd');

    expect(parser.parse()).toEqual(new Tag('abcd'));
  });

  it('correctly parses a meta tag', () => {
    const parser = new TagParser('abcd:dcba');

    expect(parser.parse()).toEqual(new MetaTag('abcd', 'dcba'));
  });

  it('correctly parses a negated tag', () => {
    const parser = new TagParser('!abcd');

    expect(parser.parse()).toEqual(new NotTag(new Tag('abcd')));

  });

  it('correctly parses an and tag', () => {
    const parser = new TagParser('abcd & efgh');

    expect(parser.parse()).toEqual(new AndTag(new Tag('abcd'), new Tag('efgh')));
  });

  it('correctly parses an or tag', () => {
    const parser = new TagParser('abcd | efgh');

    expect(parser.parse()).toEqual(new OrTag(new Tag('abcd'), new Tag('efgh')));
  });

  it('correctly parses groupings', () => {
    const parser = new TagParser('(abcd & efgh) | (ijkl & mnop)');

    expect(parser.parse()).toEqual(new OrTag(
      new AndTag(new Tag('abcd'), new Tag('efgh')),
      new AndTag(new Tag('ijkl'), new Tag('mnop'))
    ));
  });

  it('correctly parses a complex expression', () => {
    const parser = new TagParser('!abcd & (efgh | ijkl)');

    expect(parser.parse()).toEqual(new AndTag(
      new NotTag(new Tag('abcd')),
      new OrTag(new Tag('efgh'), new Tag('ijkl'))
    ));
  });

  it('correctly handles umlauts', () => {
    const parser = new TagParser('Hällo & Wörld');

    expect(parser.parse()).toEqual(new AndTag(new Tag('Hällo'), new Tag('Wörld')));
  });

  it('correctly parses a meta tag with a quoted double-quote value', () => {
    const parser = new TagParser('key:"All of this is the value"');

    expect(parser.parse()).toEqual(new MetaTag('key', 'All of this is the value'));
  });

  it('correctly parses a meta tag with a backtick-quoted value', () => {
    const parser = new TagParser('key:`All of this is the value`');

    expect(parser.parse()).toEqual(new MetaTag('key', 'All of this is the value'));
  });

  it('correctly parses a quoted value in a compound expression', () => {
    const parser = new TagParser('key:"some value" & other');

    expect(parser.parse()).toEqual(new AndTag(new MetaTag('key', 'some value'), new Tag('other')));
  });
});

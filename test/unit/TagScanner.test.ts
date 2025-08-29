import { describe, expect, it } from 'vitest'
import { TagScanner, tokenType, TokenType } from '../../src/TagScanner';

describe('TagScanner', () => {
  it('empty string', () => {
    const scanner = new TagScanner('');
    expect(scanner.nextToken().type).toEqual(tokenType.EOF);
  });

  it('scans single tokens', () => {
    ([
      ['&', tokenType.AND], 
      ['|', tokenType.OR],
      ['!', tokenType.NOT],
      ['(', tokenType.LPAREN],
      [')', tokenType.RPAREN],
      [':', tokenType.COLON],
      ['abcd', tokenType.IDENTIFIER],
    ] as const).forEach(([input, expected]) => {
      const scanner = new TagScanner(input);
      const token = scanner.nextToken();
      expect(token.type).toEqual(expected);
      expect(scanner.nextToken().type).toEqual(tokenType.EOF);
    });
  });

  it('scans whitespace', () => {
    const scanner = new TagScanner('   ');
    expect(scanner.nextToken().type).toEqual(tokenType.EOF);
  });

  it('scans single tokens with whitespace', () => {
    ([
      ['  &  ', tokenType.AND], 
      ['  |  ', tokenType.OR],
      ['  !  ', tokenType.NOT],
      ['  (  ', tokenType.LPAREN],
      ['  )  ', tokenType.RPAREN],
      ['  :  ', tokenType.COLON],
      ['  abcd  ', tokenType.IDENTIFIER],
    ] as const).forEach(([input, expected]) => {
      const scanner = new TagScanner(input);
      const token = scanner.nextToken();
      expect(token.type).toEqual(expected);
      expect(scanner.nextToken().type).toEqual(tokenType.EOF);
    });
  });

  it('scans multiple tokens', () => {
    const input = '  &  |  !  (  )  :  abcd  ';
    const scanner = new TagScanner(input);
    expect(scanner.nextToken().type).toEqual(tokenType.AND);
    expect(scanner.nextToken().type).toEqual(tokenType.OR);
    expect(scanner.nextToken().type).toEqual(tokenType.NOT);
    expect(scanner.nextToken().type).toEqual(tokenType.LPAREN);
    expect(scanner.nextToken().type).toEqual(tokenType.RPAREN);
    expect(scanner.nextToken().type).toEqual(tokenType.COLON);
    expect(scanner.nextToken().type).toEqual(tokenType.IDENTIFIER);
    expect(scanner.nextToken().type).toEqual(tokenType.EOF);
  });
});

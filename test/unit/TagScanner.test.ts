import { describe, expect, it } from 'vitest'
import { TagScanner, TokenType } from '../../src/TagScanner';

describe('TagScanner', () => {
  it('empty string', () => {
    const scanner = new TagScanner('');
    expect(scanner.nextToken().type).toEqual(TokenType.EOF);
  });

  it('scans single tokens', () => {
    ([
      ['&', TokenType.AND], 
      ['|', TokenType.OR],
      ['!', TokenType.NOT],
      ['(', TokenType.LPAREN],
      [')', TokenType.RPAREN],
      [':', TokenType.COLON],
      ['abcd', TokenType.IDENTIFIER],
    ] as const).forEach(([input, expected]) => {
      const scanner = new TagScanner(input);
      const token = scanner.nextToken();
      expect(token.type).toEqual(expected);
      expect(scanner.nextToken().type).toEqual(TokenType.EOF);
    });
  });

  it('scans whitespace', () => {
    const scanner = new TagScanner('   ');
    expect(scanner.nextToken().type).toEqual(TokenType.EOF);
  });

  it('scans single tokens with whitespace', () => {
    ([
      ['  &  ', TokenType.AND], 
      ['  |  ', TokenType.OR],
      ['  !  ', TokenType.NOT],
      ['  (  ', TokenType.LPAREN],
      ['  )  ', TokenType.RPAREN],
      ['  :  ', TokenType.COLON],
      ['  abcd  ', TokenType.IDENTIFIER],
    ] as const).forEach(([input, expected]) => {
      const scanner = new TagScanner(input);
      const token = scanner.nextToken();
      expect(token.type).toEqual(expected);
      expect(scanner.nextToken().type).toEqual(TokenType.EOF);
    });
  });

  it('scans multiple tokens', () => {
    const input = '  &  |  !  (  )  :  abcd  ';
    const scanner = new TagScanner(input);
    expect(scanner.nextToken().type).toEqual(TokenType.AND);
    expect(scanner.nextToken().type).toEqual(TokenType.OR);
    expect(scanner.nextToken().type).toEqual(TokenType.NOT);
    expect(scanner.nextToken().type).toEqual(TokenType.LPAREN);
    expect(scanner.nextToken().type).toEqual(TokenType.RPAREN);
    expect(scanner.nextToken().type).toEqual(TokenType.COLON);
    expect(scanner.nextToken().type).toEqual(TokenType.IDENTIFIER);
    expect(scanner.nextToken().type).toEqual(TokenType.EOF);
  });
});

import { describe, expect, it } from 'vitest'
import { TagScanner, tokenType, TokenType } from '../../src/TagScanner';

describe('TagScanner', () => {
  it('empty string', () => {
    const scanner = new TagScanner('');
    expect(scanner.nextToken().type).toEqual(tokenType.EOF);
  });

  it('scans quoted strings with double quotes', () => {
    const scanner = new TagScanner('"hello world"');
    const token = scanner.nextToken();
    expect(token.type).toEqual(tokenType.STRING);
    expect(token.lexeme).toEqual('hello world');
    expect(scanner.nextToken().type).toEqual(tokenType.EOF);
  });

  it('scans quoted strings with backticks', () => {
    const scanner = new TagScanner('`hello world`');
    const token = scanner.nextToken();
    expect(token.type).toEqual(tokenType.STRING);
    expect(token.lexeme).toEqual('hello world');
    expect(scanner.nextToken().type).toEqual(tokenType.EOF);
  });

  it('throws on unclosed double-quote string', () => {
    const scanner = new TagScanner('"hello');
    expect(() => scanner.nextToken()).toThrow('Unterminated string: expected closing "');
  });

  it('throws on unclosed backtick string', () => {
    const scanner = new TagScanner('`hello');
    expect(() => scanner.nextToken()).toThrow('Unterminated string: expected closing `');
  });

  it('scans a quoted string immediately followed by an operator', () => {
    const scanner = new TagScanner('"hello"&tag');
    const t1 = scanner.nextToken();
    expect(t1.type).toEqual(tokenType.STRING);
    expect(t1.lexeme).toEqual('hello');
    expect(scanner.nextToken().type).toEqual(tokenType.AND);
    const t3 = scanner.nextToken();
    expect(t3.type).toEqual(tokenType.IDENTIFIER);
    expect(t3.lexeme).toEqual('tag');
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

  it('correctly handles umlauts', () => {
    const scanner = new TagScanner('$Hällo Wörld');
    const token1 = scanner.nextToken();
    expect(token1.type).toEqual(tokenType.IDENTIFIER);
    expect(token1.lexeme).toEqual('$Hällo');
    const token2 = scanner.nextToken();
    expect(token2.type).toEqual(tokenType.IDENTIFIER);
    expect(token2.lexeme).toEqual('Wörld');
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

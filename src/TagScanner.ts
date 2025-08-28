import { Filter } from "./Tag";

export enum TokenType {
  IDENTIFIER,
  COLON,
  AND,
  OR,
  NOT,
  LPAREN,
  RPAREN,

  EOF,
}

export type Token = {
  type: TokenType;
  lexeme: string;
}

export class TagScanner {
  private current: number = 0;
  private begin: number = 0;

  constructor(private readonly filter: string) {}

  private makeToken(type: TokenType): Token {
    const token = { 
      type, 
      lexeme: this.filter.substring(this.begin, this.current),
    };

    this.begin = this.current;
    return token;
  }

  private skipWhitespace(): void {
    while (this.current < this.filter.length && /\s/.test(this.filter[this.current])) {
      this.current++;
    }
    this.begin = this.current;
  }

  private advance(): string {
    if (this.current < this.filter.length) {
      return this.filter[this.current++];
    }
    return '';
  }

  private makeIdentifier(): Token {
    while (this.current < this.filter.length && /\w/.test(this.filter[this.current])) {
      this.advance();
    }

    return this.makeToken(TokenType.IDENTIFIER);
  }

  public nextToken(): Token {
    this.skipWhitespace();
    if (this.current >= this.filter.length) {
      return this.makeToken(TokenType.EOF);
    }

    const c = this.advance();
    switch (c) {
      case '&': return this.makeToken(TokenType.AND);
      case '|': return this.makeToken(TokenType.OR);
      case '!': return this.makeToken(TokenType.NOT);
      case '(': return this.makeToken(TokenType.LPAREN);
      case ')': return this.makeToken(TokenType.RPAREN);
      case ':': return this.makeToken(TokenType.COLON);
      default: return this.makeIdentifier();
    }
  }
};

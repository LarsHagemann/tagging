export type TokenType =
  | "IDENTIFIER"
  | "STRING"
  | "COLON"
  | "AND"
  | "OR"
  | "NOT"
  | "LPAREN"
  | "RPAREN"
  | "EOF";
export const tokenType = {
  IDENTIFIER: "IDENTIFIER",
  STRING: "STRING",
  COLON: "COLON",
  AND: "AND",
  OR: "OR",
  NOT: "NOT",
  LPAREN: "LPAREN",
  RPAREN: "RPAREN",
  EOF: "EOF",
} as const;

export type Token = {
  type: TokenType;
  lexeme: string;
};

export class TagScanner {
  private current: number = 0;
  private begin: number = 0;

  constructor(private readonly filter: string) { }

  private makeToken(type: TokenType): Token {
    const token = {
      type,
      lexeme: this.filter.substring(this.begin, this.current),
    };

    this.begin = this.current;
    return token;
  }

  private skipWhitespace(): void {
    while (
      this.current < this.filter.length &&
      /\s/.test(this.filter[this.current]!)
    ) {
      this.current++;
    }
    this.begin = this.current;
  }

  private advance(): string {
    if (this.current < this.filter.length) {
      return this.filter[this.current++]!;
    }
    return "";
  }

  private isValidIdentifierChar(c: string): boolean {
    return /[^\s&|!():]/.test(c);
  }

  private makeIdentifier(): Token {
    while (
      this.current < this.filter.length &&
      this.isValidIdentifierChar(this.filter[this.current]!)
    ) {
      this.advance();
    }

    return this.makeToken(tokenType.IDENTIFIER);
  }

  public nextToken(): Token {
    this.skipWhitespace();
    if (this.current >= this.filter.length) {
      return this.makeToken(tokenType.EOF);
    }

    const c = this.advance();
    switch (c) {
      case "&":
        return this.makeToken(tokenType.AND);
      case "|":
        return this.makeToken(tokenType.OR);
      case "!":
        return this.makeToken(tokenType.NOT);
      case "(":
        return this.makeToken(tokenType.LPAREN);
      case ")":
        return this.makeToken(tokenType.RPAREN);
      case ":":
        return this.makeToken(tokenType.COLON);
      case '"':
      case "`":
        return this.makeString(c);
      default:
        return this.makeIdentifier();
    }
  }

  private makeString(quote: string): Token {
    while (this.current < this.filter.length && this.filter[this.current] !== quote) {
      this.advance();
    }
    if (this.current >= this.filter.length) {
      throw new Error(`Unterminated string: expected closing ${quote}`);
    }
    this.advance(); // consume closing quote
    const lexeme = this.filter.substring(this.begin + 1, this.current - 1);
    this.begin = this.current;
    return { type: tokenType.STRING, lexeme };
  }
}

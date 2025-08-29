import { AndTag, Filter, MetaTag, NotTag, OrTag, Tag, TrueTag } from "./Tag";
import { TagScanner, Token, tokenType, TokenType } from "./TagScanner";

export abstract class BaseTagScanner {
  abstract nextToken(): Token;
}

export class TagParser {
  private readonly scanner: BaseTagScanner;

  private current: Token;
  private previous: Token;

  constructor(filter: string, Scanner: new (input: string) => BaseTagScanner = TagScanner) {
    this.scanner = new Scanner(filter);
    this.current = this.scanner.nextToken();
    this.previous = this.current;
  }

  private advance(): void {
    this.previous = this.current;
    this.current = this.scanner.nextToken();
  }

  private match(expected: TokenType): boolean {
    if (this.current.type === expected) {
      this.advance();
      return true;
    }
    return false;
  }

  private expect(expected: TokenType, message: string): void {
    if (this.current.type === expected) {
      this.advance();
    } else {
      throw new Error(message);
    }
  }

  // (<literal> | <literal>:<literal> | <lparen><binary><rparen>)
  private parsePrimary(): Filter {
    if (this.match(tokenType.LPAREN)) {
      const expr = this.parseBinary();
      this.expect(tokenType.RPAREN, "Expected closing parenthesis");
      return expr;
    }

    this.expect(tokenType.IDENTIFIER, "Expected identifier");
    const key = this.previous.lexeme;
    if (this.match(tokenType.COLON)) {
      this.advance();
      return new MetaTag(key, this.previous.lexeme);
    }
    return new Tag(key);
  }

  // (<primary> | !<unary>)
  private parseUnary(): Filter {
    if (this.match(tokenType.NOT)) {
      const operand = this.parseUnary();
      return new NotTag(operand);
    }
    return this.parsePrimary();
  }

  // (<unary> [<operator> <unary>])
  private parseBinary(): Filter {
    let left = this.parseUnary();

    while (this.match(tokenType.AND) || this.match(tokenType.OR)) {
      const operator = this.previous;
      const right = this.parseUnary();
      if (operator.type === tokenType.AND) {
        left = new AndTag(left, right);
      }
      else {
        left = new OrTag(left, right);
      }
    }

    return left;
  }

  // (<eof> | <binary>)
  public parse(): Filter {
    if (this.current.type === tokenType.EOF) {
      return new TrueTag();
    }

    const filter = this.parseBinary();
    this.expect(tokenType.EOF, "Expected end of input");
    return filter;
  }
}

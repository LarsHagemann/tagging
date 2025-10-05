## Tagging system

[![CI/CD](https://github.com/LarsHagemann/tagging/actions/workflows/ci_cd.yml/badge.svg)](https://github.com/LarsHagemann/tagging/actions/workflows/ci_cd.yml)

This package provides a simple way of parsing tags into a programmatically useful form. 

### Usage

Parse a filter query:
```typescript
const parser = new TagParser('(abcd & efgh) | (ijkl & mnop)');
const parsed = parser.parse();

/*
parsed = OrTag(
  AndTag(Tag('abcd'), Tag('efgh')),
  AndTag(Tag('ijkl'), Tag('mnop'))
);
*/
```

You can also provide your own scanner implementation (if you want to change the way that certain lexemes are tokenized):
```typescript
class MyScanner {
  public nextToken(): Token {
    // scans && into AND and 'OR' into OR
  }

  // ...
};

const parser = new TagParser('[abcd && efgh] OR [ijkl && mnop]', MyScanner);
const parsed = parser.parse();
```

See the [Samples](./sample/) and the integration tests for example applications of this library. 

### Tests

Run the unit tests via 
```sh
npm run test:unit
```

or run the integration tests via
```sh
npm run test
- or
npm test
```

You need `docker` installed on your systems to run the integration tests. 

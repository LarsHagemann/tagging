import { describe, expect, it } from "vitest";
import { TagParser } from "../../src/TagParser";
import { TagIdCache } from "../../src/TagIdCache";
import { Tag } from "../../src/Tag";
import { TagSqlBuilder } from "../../sample/TagSqlBuilder";

const config = {
  userdataTableColumns: ["id", "email", "name"],
  userdataTableIdColumn: "id",
  userdataTableName: "userdata",
};

describe("TagSqlBuilder parameterization", () => {
  it("binds tag ids as ordered $N parameters instead of interpolating them", () => {
    const cache = new TagIdCache();
    cache.onTagAdded(new Tag("tag1"), "1");
    cache.onTagAdded(new Tag("tag2"), "2");
    cache.onTagAdded(new Tag("tag3"), "3");

    const builder = new TagSqlBuilder(config, cache);
    const filter = new TagParser("tag1 & (tag2 | tag3)").parse();
    const result = builder.buildListFilteredEntitiesQuery(filter);

    expect(result.success).toBe(true);
    if (!result.success) return;

    expect(result.stmt.having).toContain("ut.tag_id = $1");
    expect(result.stmt.having).toContain("ut.tag_id = $2");
    expect(result.stmt.having).toContain("ut.tag_id = $3");
    // Placeholders are bound to values in the order they appear in the SQL.
    expect(result.stmt.parameters).toEqual(["1", "2", "3"]);
  });

  it("never interpolates a malicious tag id into the query string", () => {
    const malicious = "1' OR '1'='1"; // would break out of a quoted literal
    const cache = new TagIdCache();
    cache.onTagAdded(new Tag("evil"), malicious);

    const builder = new TagSqlBuilder(config, cache);
    const filter = new TagParser("evil").parse();
    const result = builder.buildListFilteredEntitiesQuery(filter);

    expect(result.success).toBe(true);
    if (!result.success) return;

    // The dangerous value only ever lives in the bound parameters, never in SQL.
    expect(result.stmt.having).not.toContain(malicious);
    expect(result.stmt.having).toContain("ut.tag_id = $1");
    expect(result.stmt.parameters).toEqual([malicious]);
  });
});

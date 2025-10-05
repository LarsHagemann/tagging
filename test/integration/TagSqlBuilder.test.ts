import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { SqlService } from "../SqlService";
import { TagParser } from "../../src/TagParser";
import {
  buildQueryFromSelectStatement,
  TagSqlBuilder,
} from "../../sample/TagSqlBuilder";
import { TagIdCache } from "../../src/TagIdCache";
import { Tag } from "../../src/Tag";

describe("TagSqlBuilder", () => {
  const dbService = new SqlService();
  const cache = new TagIdCache();

  cache.init([
    {
      tag: new Tag("tag1"),
      tagId: "1",
    },
    {
      tag: new Tag("tag2"),
      tagId: "2",
    },
    {
      tag: new Tag("tag3"),
      tagId: "3",
    },
    {
      tag: new Tag("tag4"),
      tagId: "4",
    },
  ]);

  beforeEach(async () => {
    await dbService.truncateTables();

    await dbService.client`
      CREATE TABLE tags (
        id SERIAL PRIMARY KEY,
        key VARCHAR(255) NOT NULL
        value VARCHAR(255)
      );
    `;

    await dbService.client`
      CREATE TABLE userdata (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) NOT NULL,
        name VARCHAR(255) NOT NULL,
        timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;

    await dbService.client`
      CREATE TABLE userdata_tags (
        tag_id INTEGER REFERENCES tags(id),
        userdata_id INTEGER REFERENCES userdata(id),
        PRIMARY KEY (tag_id, userdata_id)
      );
    `;

    const users = [
      {
        email: "user1@example.com",
        name: "User One",
      },
      {
        email: "user2@example.com",
        name: "User Two",
      },
      {
        email: "user3@example.com",
        name: "User Three",
      },
      {
        email: "user4@example.com",
        name: "User Four",
      },
    ];

    await dbService.client`
      INSERT INTO userdata (email, name)
      VALUES
        (${users[0].email}, ${users[0].name}),
        (${users[1].email}, ${users[1].name}),
        (${users[2].email}, ${users[2].name}),
        (${users[3].email}, ${users[3].name})
    `;

    await dbService.client`
      INSERT INTO tags (key, value)
      VALUES
        ('tag1', NULL),
        ('tag2', NULL),
        ('tag3', 'meta'),
        ('tag4', NULL)
    `;

    await dbService.client`
      INSERT INTO userdata_tags (userdata_id, tag_id)
      VALUES
        (1, 1),
        (1, 2),
        (2, 2),
        (2, 3),
        (3, 3),
        (3, 4),
        (4, 4)
    `;
  });

  afterAll(async () => {
    await dbService.truncateTables();
  });

  it("Correctly applies the empty filter", async () => {
    const parser = new TagParser("");
    const filter = parser.parse();

    const builder = new TagSqlBuilder(
      {
        userdataTableColumns: ["id", "email", "name"],
        userdataTableIdColumn: "id",
        userdataTableName: "userdata",
      },
      cache
    );

    const sql = builder.buildListFilteredEntitiesQuery(filter);

    expect(sql.success).toBe(true);

    if (sql.success) {
      const query = buildQueryFromSelectStatement(sql.stmt);
      const results = await dbService.client.unsafe(query);

      expect(results.length).toBe(4);
      expect(results).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            email: "user1@example.com",
            name: "User One",
          }),
          expect.objectContaining({
            email: "user2@example.com",
            name: "User Two",
          }),
          expect.objectContaining({
            email: "user3@example.com",
            name: "User Three",
          }),
          expect.objectContaining({
            email: "user4@example.com",
            name: "User Four",
          }),
        ])
      );
    }
  });

  it("Correctly applies a single tag filter", async () => {
    const parser = new TagParser("tag1");
    const filter = parser.parse();

    const builder = new TagSqlBuilder(
      {
        userdataTableColumns: ["id", "email", "name"],
        userdataTableIdColumn: "id",
        userdataTableName: "userdata",
      },
      cache
    );

    const sql = builder.buildListFilteredEntitiesQuery(filter);

    expect(sql.success).toBe(true);

    if (sql.success) {
      const query = buildQueryFromSelectStatement(sql.stmt);
      const results = await dbService.client.unsafe(query);

      expect(results.length).toBe(1);
      expect(results).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            email: "user1@example.com",
            name: "User One",
          }),
        ])
      );
    }
  });

  it("Correctly applies a single tag filter", async () => {
    const builder = new TagSqlBuilder(
      {
        userdataTableColumns: ["id", "email", "name"],
        userdataTableIdColumn: "id",
        userdataTableName: "userdata",
      },
      cache
    );

    {
      const parser = new TagParser("tag1");
      const filter = parser.parse();

      const sql = builder.buildListFilteredEntitiesQuery(filter);

      expect(sql.success).toBe(true);

      if (sql.success) {
        const query = buildQueryFromSelectStatement(sql.stmt);
        const results = await dbService.client.unsafe(query);

        expect(results.length).toBe(1);
        expect(results).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              email: "user1@example.com",
              name: "User One",
            }),
          ])
        );
      }
    }

    {
      const parser = new TagParser("tag2");
      const filter = parser.parse();

      const sql = builder.buildListFilteredEntitiesQuery(filter);

      expect(sql.success).toBe(true);

      if (sql.success) {
        const query = buildQueryFromSelectStatement(sql.stmt);
        const results = await dbService.client.unsafe(query);

        expect(results.length).toBe(2);
        expect(results).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              email: "user1@example.com",
              name: "User One",
            }),
            expect.objectContaining({
              email: "user2@example.com",
              name: "User Two",
            }),
          ])
        );
      }
    }
  });

  it("Correctly applies an and filter", async () => {
    const builder = new TagSqlBuilder(
      {
        userdataTableColumns: ["id", "email", "name"],
        userdataTableIdColumn: "id",
        userdataTableName: "userdata",
      },
      cache
    );

    const parser = new TagParser("tag2 & tag3");
    const filter = parser.parse();

    const sql = builder.buildListFilteredEntitiesQuery(filter);

    expect(sql.success).toBe(true);

    if (sql.success) {
      const query = buildQueryFromSelectStatement(sql.stmt);
      const results = await dbService.client.unsafe(query);

      expect(results.length).toBe(1);
      expect(results).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            email: "user2@example.com",
            name: "User Two",
          }),
        ])
      );
    }
  });

  it("Correctly applies an or filter", async () => {
    const builder = new TagSqlBuilder(
      {
        userdataTableColumns: ["id", "email", "name"],
        userdataTableIdColumn: "id",
        userdataTableName: "userdata",
      },
      cache
    );

    const parser = new TagParser("tag2 | tag3");
    const filter = parser.parse();

    const sql = builder.buildListFilteredEntitiesQuery(filter);

    expect(sql.success).toBe(true);

    if (sql.success) {
      const query = buildQueryFromSelectStatement(sql.stmt);
      const results = await dbService.client.unsafe(query);

      expect(results.length).toBe(3);
      expect(results).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            email: "user1@example.com",
            name: "User One",
          }),
          expect.objectContaining({
            email: "user2@example.com",
            name: "User Two",
          }),
          expect.objectContaining({
            email: "user3@example.com",
            name: "User Three",
          }),
        ])
      );
    }
  });

  it("Correctly applies a not filter", async () => {
    const builder = new TagSqlBuilder(
      {
        userdataTableColumns: ["id", "email", "name"],
        userdataTableIdColumn: "id",
        userdataTableName: "userdata",
      },
      cache
    );

    const parser = new TagParser("!tag3");
    const filter = parser.parse();

    const sql = builder.buildListFilteredEntitiesQuery(filter);

    expect(sql.success).toBe(true);

    if (sql.success) {
      const query = buildQueryFromSelectStatement(sql.stmt);
      const results = await dbService.client.unsafe(query);

      expect(results.length).toBe(2);
      expect(results).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            email: "user1@example.com",
            name: "User One",
          }),
          expect.objectContaining({
            email: "user4@example.com",
            name: "User Four",
          }),
        ])
      );
    }
  });

  it("Correctly applies a grouping filter", async () => {
    const builder = new TagSqlBuilder(
      {
        userdataTableColumns: ["id", "email", "name"],
        userdataTableIdColumn: "id",
        userdataTableName: "userdata",
      },
      cache
    );

    const parser = new TagParser("tag1 | (tag3 & tag4)");
    const filter = parser.parse();

    const sql = builder.buildListFilteredEntitiesQuery(filter);

    expect(sql.success).toBe(true);

    if (sql.success) {
      const query = buildQueryFromSelectStatement(sql.stmt);
      const results = await dbService.client.unsafe(query);

      expect(results.length).toBe(2);
      expect(results).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            email: "user1@example.com",
            name: "User One",
          }),
          expect.objectContaining({
            email: "user3@example.com",
            name: "User Three",
          }),
        ])
      );
    }
  });
});

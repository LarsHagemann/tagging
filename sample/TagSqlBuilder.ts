import {
  AndTag,
  Filter,
  MetaTag,
  NotTag,
  OrTag,
  Tag,
  TrueTag,
} from "../src/Tag";
import { TagIdCache } from "../src/TagIdCache";

export type TagSqlBuilderConfig = {
  userdataTableName: string;
  userdataTableIdColumn: string;
  userdataTableColumns: string[];
};

export type SelectStatement = {
  select: string;
  from: string;
  joins?: {
    join: "INNER" | "LEFT" | "RIGHT";
    table: string;
    on: string;
  }[];
  groupBy?: string;
  having?: string;
  sortBy?: "timestamp" | "random";
  where?: string;
  sortDirection?: "asc" | "desc";
  // Values bound to the $1, $2, ... placeholders in the query, in order.
  // Pass these to the driver (e.g. `sql.unsafe(query, parameters)`) so that
  // tag ids are never interpolated directly into the SQL string.
  parameters?: string[];
};

export type UpdateStatement = {
  table: string;
  set: { [column: string]: any };
  where?: string;
};

export const buildQueryFromSelectStatement = (stmt: SelectStatement) => {
  const query = `SELECT ${stmt.select} FROM ${stmt.from}`;
  const joinClauses = (stmt.joins ?? [])
    .map((join) => `${join.join} JOIN ${join.table} ON ${join.on}`)
    .join(" ");
  const whereClause = stmt.where ? `WHERE ${stmt.where}` : "";
  const groupByClause = stmt.groupBy ? `GROUP BY ${stmt.groupBy}` : "";
  const havingClause = stmt.having ? `HAVING ${stmt.having}` : "";
  const orderByClause = stmt.sortBy
    ? `ORDER BY ${stmt.sortBy} ${stmt.sortDirection ?? "desc"}`
    : "";

  return `${query} ${joinClauses} ${whereClause} ${groupByClause} ${havingClause} ${orderByClause}`;
};

export type TagSqlBuilderResult<
  T = SelectStatement,
  Parameters extends string[] = []
> =
  | {
      success: false;
      message: string;
    }
  | {
      success: true;
      stmt: T;
    };

type CurrentParse = {
  sortBy: "timestamp" | "random";
  sortDirection: "asc" | "desc";
};

export class TagSqlBuilder {
  private readonly currentParse: CurrentParse;

  constructor(
    private readonly builderConfig: TagSqlBuilderConfig,
    private readonly tagIdCache: TagIdCache
  ) {
    this.currentParse = {
      sortBy: "timestamp",
      sortDirection: "asc",
    };
  }

  // Records `value` as a bound parameter and returns its `$N` placeholder.
  private bindParameter(parameters: string[], value: string): string {
    parameters.push(value);
    return `$${parameters.length}`;
  }

  private parseMetaTag(tag: MetaTag, parameters: string[]): string {
    if (tag.key === "sort") {
      switch (tag.value) {
        case "random":
          this.currentParse.sortBy = "random";
          break;
        case "oldest":
          this.currentParse.sortBy = "timestamp";
          this.currentParse.sortDirection = "asc";
          break;
        case "newest":
          this.currentParse.sortBy = "timestamp";
          this.currentParse.sortDirection = "desc";
          break;
      }
      return `1=1`;
    }

    const placeholder = this.bindParameter(
      parameters,
      this.tagIdCache.tagToTagId(tag)
    );
    return `SUM(CASE WHEN ut.tag_id = ${placeholder} THEN 1 ELSE 0 END) > 0`;
  }

  private sqlFilterConditions(filter: Filter, parameters: string[]): string {
    if (filter instanceof Tag) {
      const placeholder = this.bindParameter(
        parameters,
        this.tagIdCache.tagToTagId(filter)
      );
      return `SUM(CASE WHEN ut.tag_id = ${placeholder} THEN 1 ELSE 0 END) > 0`;
    } else if (filter instanceof MetaTag) {
      return this.parseMetaTag(filter, parameters);
    } else if (filter instanceof TrueTag) {
      return `1=1`;
    } else if (filter instanceof OrTag) {
      return `(${this.sqlFilterConditions(
        filter.left,
        parameters
      )} OR ${this.sqlFilterConditions(filter.right, parameters)})`;
    } else if (filter instanceof AndTag) {
      return `(${this.sqlFilterConditions(
        filter.left,
        parameters
      )} AND ${this.sqlFilterConditions(filter.right, parameters)})`;
    } else if (filter instanceof NotTag) {
      return `NOT (${this.sqlFilterConditions(filter.inner, parameters)})`;
    }

    return "1=1";
  }

  private setupParse() {
    this.currentParse.sortBy = "timestamp";
    this.currentParse.sortDirection = "asc";
  }

  public buildListFilteredEntitiesQuery(filter: Filter): TagSqlBuilderResult {
    this.setupParse();

    try {
      const parameters: string[] = [];
      const having = this.sqlFilterConditions(filter, parameters);

      return {
        success: true,
        stmt: {
          select: `${this.builderConfig.userdataTableColumns
            .map((col) => `u.${col}`)
            .join(", ")}`,
          from: `${this.builderConfig.userdataTableName} u`,
          joins: [
            {
              join: "INNER",
              table: "userdata_tags ut",
              on: `u.${this.builderConfig.userdataTableIdColumn} = ut.userdata_id`,
            },
          ],
          groupBy: `u.${this.builderConfig.userdataTableIdColumn}`,
          having,
          sortBy: this.currentParse.sortBy,
          sortDirection: this.currentParse.sortDirection,
          parameters,
        },
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  public buildListEntityTagsQuery(): TagSqlBuilderResult<
    SelectStatement,
    ["$entityId"]
  > {
    try {
      return {
        success: true,
        stmt: {
          select: `t.*, COUNT(ut.userdata_id) AS usage_count`,
          from: `tags t`,
          where: `ut.userdata_id = $entityId`,
          joins: [
            {
              join: "LEFT",
              table: "userdata_tags ut",
              on: `t.id = ut.tag_id`,
            },
          ],
        },
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  public buildAddTagToEntityQuery(): TagSqlBuilderResult<
    SelectStatement,
    ["$entityId", "$tagKey", "$tagValue"]
  > {
    try {
      return {
        success: true,
        stmt: {
          select: `*`,
          from: `userdata_tags`,
          where: `userdata_id = $entityId AND tag_key = $tagKey AND tag_value = $tagValue`,
        },
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }
}

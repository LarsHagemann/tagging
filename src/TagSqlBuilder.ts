import { AndTag, Filter, MetaTag, NotTag, OrTag, Tag, TrueTag } from "./Tag";
import { TagIdCache } from "./TagIdCache";

export type TagSqlBuilderConfig = {
  userdataTableName: string;
  userdataTableIdColumn: string;
  userdataTableColumns: string[];
};

export type SelectStatement = {
  select: string;
  from: string;
  joins: {
    join: 'INNER' | 'LEFT' | 'RIGHT';
    table: string;
    on: string;
  }[];
  groupBy: string;
  having: string;
  sortBy: 'timestamp' | 'random';
  sortDirection: 'asc' | 'desc';
};

export const buildQueryFromSelectStatement = (stmt: SelectStatement) => {
  const query = `SELECT ${stmt.select} FROM ${stmt.from}`;
  const joinClauses = stmt.joins.map(join => `${join.join} JOIN ${join.table} ON ${join.on}`).join(' ');
  const groupByClause = `GROUP BY ${stmt.groupBy}`;
  const havingClause = `HAVING ${stmt.having}`;
  const orderByClause = `ORDER BY ${stmt.sortBy} ${stmt.sortDirection}`;

  return `${query} ${joinClauses} ${groupByClause} ${havingClause} ${orderByClause}`;
};

export type TagSqlBuilderResult = {
  success: false;
  message: string;
} | {
  success: true;
  sql: SelectStatement;
};

type CurrentParse = {
  sortBy: 'timestamp' | 'random';
  sortDirection: 'asc' | 'desc';
};

export class TagSqlBuilder {
  private readonly currentParse: CurrentParse;

  constructor(
    private readonly builderConfig: TagSqlBuilderConfig,
    private readonly tagIdCache: TagIdCache
  ) {
    this.currentParse = {
      sortBy: 'timestamp',
      sortDirection: 'asc',
    };
  }

  private parseMetaTag(tag: MetaTag): string {
    if (tag.key === 'sort') {
      switch (tag.value) {
      case 'random':
        this.currentParse.sortBy = 'random';
        break;
      case 'oldest':
        this.currentParse.sortBy = 'timestamp';
        this.currentParse.sortDirection = 'asc';
        break;
      case 'newest':
        this.currentParse.sortBy = 'timestamp';
        this.currentParse.sortDirection = 'desc';
        break;
      }
      return `1=1`;
    }

    return `SUM(CASE WHEN ut.tag_id = '${this.tagIdCache.tagToTagId(tag)}' THEN 1 ELSE 0 END) > 0`;
  }

  private sqlFilterConditions(filter: Filter): string {
    if (filter instanceof Tag) {
      return `SUM(CASE WHEN ut.tag_id = '${this.tagIdCache.tagToTagId(filter)}' THEN 1 ELSE 0 END) > 0`;
    } else if (filter instanceof MetaTag) {
      return this.parseMetaTag(filter);
    } else if (filter instanceof TrueTag) {
      return `1=1`;
    } else if (filter instanceof OrTag) {
      return `(${this.sqlFilterConditions(filter.left)} OR ${this.sqlFilterConditions(filter.right)})`;
    } else if (filter instanceof AndTag) {
      return `(${this.sqlFilterConditions(filter.left)} AND ${this.sqlFilterConditions(filter.right)})`;
    } else if (filter instanceof NotTag) {
      return `NOT (${this.sqlFilterConditions(filter.inner)})`;
    }

    return "1=1";
  }

  private setupParse() {
    this.currentParse.sortBy = 'timestamp';
    this.currentParse.sortDirection = 'asc';
  }

  public buildTagFilterQuery(filter: Filter): TagSqlBuilderResult {
    this.setupParse();

    try {
      return {
        success: true,
        sql: {
          select: `${this.builderConfig.userdataTableColumns.map(col => `u.${col}`).join(', ')}`,
          from: `${this.builderConfig.userdataTableName} u`,
          joins: [
            {
              join: 'INNER',
              table: 'userdata_tags ut',
              on: `u.${this.builderConfig.userdataTableIdColumn} = ut.userdata_id`
            },
          ],
          groupBy: `u.${this.builderConfig.userdataTableIdColumn}`,
          having: `${this.sqlFilterConditions(filter)}`,
          sortBy: this.currentParse.sortBy,
          sortDirection: this.currentParse.sortDirection,
        },
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }
};

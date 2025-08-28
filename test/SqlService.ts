import postgres from 'postgres';

export class SqlService {
  private readonly client_: postgres.Sql;

  constructor() {
    this.client_ = postgres({
      host: 'localhost',
      port: 5432,
      username: 'user',
      password: 'password',
      database: 'test_db',
      debug: () => {},
      onnotice: () => {},
    });
  }

  public async truncateTables(): Promise<void> {
    // delete all tables
    await this.client_.unsafe('DROP SCHEMA public CASCADE;');
    await this.client_.unsafe('CREATE SCHEMA public;');
  }

  public get client(): postgres.Sql {
    return this.client_;
  }
};

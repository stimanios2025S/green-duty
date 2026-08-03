// Ambient types for Node's built-in `node:sqlite` module.
// Installed @types/node (v20) predates this module; Node 26 provides it at runtime.
declare module "node:sqlite" {
  export interface StatementResultingChanges {
    changes: number | bigint;
    lastInsertRowid: number | bigint;
  }

  export interface StatementSync {
    run(...anonymousParameters: unknown[]): StatementResultingChanges;
    get(...anonymousParameters: unknown[]): Record<string, unknown> | undefined;
    all(...anonymousParameters: unknown[]): Record<string, unknown>[];
  }

  export interface DatabaseSync {
    exec(sql: string): void;
    prepare(sql: string): StatementSync;
    close(): void;
  }

  export interface DatabaseOptions {
    open?: boolean;
    readOnly?: boolean;
    enableForeignKeyConstraints?: boolean;
  }

  export const DatabaseSync: {
    new (path: string, options?: DatabaseOptions): DatabaseSync;
    (path: string, options?: DatabaseOptions): DatabaseSync;
  };

  export const constants: Record<string, unknown>;
}

import { Pool } from "pg";

export function urlDoBanco(): string {
  return (
    process.env.DATABASE_URL ?? "postgres://admin:password123@127.0.0.1:5432/almanak"
  );
}

export function criarPool(): Pool {
  return new Pool({ connectionString: urlDoBanco() });
}

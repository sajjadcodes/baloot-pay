import 'dotenv/config';
import { defineConfig as definePostgresConfig } from '@prisma/orm-postgres/config';
import { definePrismaConfig } from 'prisma/config';

const migrationDatabaseUrl = process.env['MIGRATION_DATABASE_URL'];

if (!migrationDatabaseUrl) {
  throw new Error('MIGRATION_DATABASE_URL is required for Prisma tooling.');
}

let migrationDatabaseProtocol: string;
try {
  migrationDatabaseProtocol = new URL(migrationDatabaseUrl).protocol;
} catch {
  throw new Error('MIGRATION_DATABASE_URL must be a valid PostgreSQL URL.');
}

if (
  migrationDatabaseProtocol !== 'postgres:' &&
  migrationDatabaseProtocol !== 'postgresql:'
) {
  throw new Error('MIGRATION_DATABASE_URL must use PostgreSQL.');
}

const ormConfig: object = definePostgresConfig({
  contract: './src/prisma/contract.prisma',
  db: {
    connection: migrationDatabaseUrl,
  },
});

export default definePrismaConfig({ orm: ormConfig });

import dotenv from 'dotenv';
import dotenvExpand from 'dotenv-expand';
dotenvExpand.expand(dotenv.config({ path: '.env.development' }));
import { Injectable, OnModuleInit } from '@nestjs/common';
import { drizzle, NodePgDatabase } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';

@Injectable()
export class DrizzleService implements OnModuleInit {
  private db!: NodePgDatabase<typeof schema>;

  onModuleInit() {
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL!,
    });

    this.db = drizzle(pool, { schema });
  }

  get connection() {
    return this.db;
  }
}

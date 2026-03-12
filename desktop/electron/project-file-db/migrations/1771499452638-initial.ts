import type { MigrationInterface, QueryRunner } from "typeorm";

export class Initial1771499452638 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE assets(
                id uuid NOT NULL,
                need_sync datetime,
                synced_at datetime,
                server_state JSONB,
                conflict varchar,
                conflict_message varchar,
                server_deleted bool,
                PRIMARY KEY (id)
            );
        `);
        await queryRunner.query(`
            CREATE TABLE workspaces(
                id uuid NOT NULL,
                need_sync datetime,
                synced_at datetime,
                server_state JSONB,
                conflict varchar,
                conflict_message varchar,
                server_deleted bool,
                PRIMARY KEY (id)
            );
        `);

        await queryRunner.query(`
            CREATE TABLE sync_logs(
                id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
                sync_start datetime,
                sync_state datetime,
                sync_end datetime,
                error JSONB
            );
        `);

    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DELETE TABLE assets`);
        await queryRunner.query(`DELETE TABLE workspaces`);
        await queryRunner.query(`DELETE TABLE sync_logs`);
    }

}

import { DataSource } from 'typeorm';
import path from 'node:path';
import { PROJECT_META_DB } from './project-db-constants';
import { Initial1771499452638 } from './migrations/1771499452638-initial';

export function getProjectDataSource(projectPath: string): DataSource{
    return new DataSource({
        type: 'better-sqlite3',
        database: path.join(projectPath, PROJECT_META_DB),
        entities: [],
        synchronize: false,
        migrations: [
            Initial1771499452638,
        ],
        logging: true
    })
}
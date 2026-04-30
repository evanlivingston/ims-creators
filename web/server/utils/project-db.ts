import { ProjectFileDb } from '../../project-file-db/ProjectFileDb';

let _db: ProjectFileDb | null = null;
let _initPromise: Promise<void> | null = null;

export async function getProjectDb(): Promise<ProjectFileDb> {
  if (_db && _initPromise) {
    await _initPromise;
    return _db;
  }

  const projectPath = process.env.PROJECT_PATH;
  if (!projectPath) {
    throw new Error('PROJECT_PATH environment variable is not set');
  }

  _db = new ProjectFileDb(projectPath);
  _initPromise = _db.init();
  await _initPromise;
  return _db;
}

export async function reloadProjectDb(): Promise<void> {
  _db = null;
  _initPromise = null;
  await getProjectDb();
  console.log('[project-db] Reloaded from disk');
}

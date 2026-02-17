import { ProjectFileDb } from "./ProjectFileDb";

const projectDbMap = new Map<string, ProjectFileDb>();

export function getProjectDb(projectPath: string): ProjectFileDb{
    let db = projectDbMap.get(projectPath);
    if (!db){
        db = new ProjectFileDb(projectPath);
        projectDbMap.set(projectPath, db);
    }
    return db;
}

export async function closeProjectDb(projectPath: string): Promise<void> {
    const db = getProjectDb(projectPath);
    await db.destroy();
    projectDbMap.delete(projectPath);
}

export async function closeAllProjectDb(){
    const closing_projects = [...projectDbMap.entries()];
    for (const [path, db] of closing_projects){
        await db.destroy();
        projectDbMap.delete(path);
    }
}
import { defineEventHandler } from 'h3';
import { execFile } from 'child_process';
import { promisify } from 'util';

const execFileAsync = promisify(execFile);

/**
 * Auto-commit design data after any write operation via the project API.
 * Runs after the response is sent so it doesn't slow down the request.
 */
export default defineEventHandler((event) => {
  const path = event.path || '';
  const method = event.method || 'GET';

  // Only trigger on write operations to the project API
  if (!path.startsWith('/api/project/') || method === 'GET') return;

  // Skip read-like POST endpoints
  if (path.includes('/get-short') || path.includes('/get-full') ||
      path.includes('/get-view') || path.includes('/graph') ||
      path.includes('/get-history') || path.includes('/info') ||
      path.includes('/context')) return;

  // Schedule commit after response completes
  event.node.res.on('finish', () => {
    const projectPath = process.env.PROJECT_PATH;
    if (!projectPath) return;
    execFileAsync('git', ['add', '-A'], { cwd: projectPath })
      .then(() => execFileAsync('git', ['diff', '--cached', '--quiet'], { cwd: projectPath }).catch(() =>
        execFileAsync('git', ['commit', '-m', `Edit via web UI: ${path}`], { cwd: projectPath })
          .then(() => {
            console.log(`[auto-commit] Edit via web UI: ${path}`);
            execFileAsync('git', ['push'], { cwd: projectPath }).catch(
              (err) => console.error('[auto-push] failed:', err.message)
            );
          })
      ))
      .catch((err) => console.error('[auto-commit] failed:', err));
  });
});

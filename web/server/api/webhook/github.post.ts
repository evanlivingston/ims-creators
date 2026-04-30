import { defineEventHandler, readBody, getHeader, createError } from 'h3';
import { execFile } from 'child_process';
import { promisify } from 'util';
import { createHmac } from 'crypto';
import { reloadProjectDb } from '../../utils/project-db';

const execFileAsync = promisify(execFile);

/**
 * GitHub webhook endpoint. Pulls latest design data when a push event
 * is received from the design-data repo.
 *
 * Configure in GitHub repo Settings > Webhooks:
 *   URL: https://ims.sieisst.com/api/webhook/github
 *   Content type: application/json
 *   Secret: (set WEBHOOK_SECRET env var)
 *   Events: Just the push event
 */
export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const signature = getHeader(event, 'x-hub-signature-256') || '';
  const secret = process.env.WEBHOOK_SECRET || '';

  // Verify signature if secret is configured
  if (secret) {
    const expected = 'sha256=' + createHmac('sha256', secret)
      .update(JSON.stringify(body))
      .digest('hex');
    if (signature !== expected) {
      throw createError({ statusCode: 401, statusMessage: 'Invalid signature' });
    }
  }

  const githubEvent = getHeader(event, 'x-github-event');
  if (githubEvent !== 'push') {
    return { ok: true, action: 'ignored', event: githubEvent };
  }

  const projectPath = process.env.PROJECT_PATH;
  if (!projectPath) {
    throw createError({ statusCode: 500, statusMessage: 'PROJECT_PATH not set' });
  }

  try {
    await execFileAsync('git', ['pull', '--rebase'], { cwd: projectPath });
    console.log('[webhook] Pulled latest design data');
    await reloadProjectDb();
    return { ok: true, action: 'pulled' };
  } catch (err: any) {
    console.error('[webhook] Pull failed:', err.message);
    return { ok: false, error: err.message };
  }
});

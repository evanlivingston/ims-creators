import { defineEventHandler, getRouterParam, createError, setHeader, sendStream } from 'h3';
import { createReadStream, existsSync } from 'fs';
import { join, resolve, normalize } from 'path';
import { lookup } from 'mime-types';

export default defineEventHandler(async (event) => {
  const path = getRouterParam(event, 'path') || '';
  const projectPath = process.env.PROJECT_PATH;
  if (!projectPath) throw createError({ statusCode: 500, statusMessage: 'PROJECT_PATH not set' });

  // Prevent path traversal
  const filePath = resolve(join(projectPath, normalize(path).replace(/^(\.\.(\/|\\|$))+/, '')));
  if (!filePath.startsWith(resolve(projectPath))) {
    throw createError({ statusCode: 403, statusMessage: 'Forbidden' });
  }

  if (!existsSync(filePath)) throw createError({ statusCode: 404, statusMessage: 'File not found' });

  const mimeType = lookup(filePath) || 'application/octet-stream';
  setHeader(event, 'content-type', mimeType);
  setHeader(event, 'cache-control', 'public, max-age=3600');
  return sendStream(event, createReadStream(filePath));
});

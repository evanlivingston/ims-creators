import { defineEventHandler, getRouterParam, createError, setHeader, sendStream } from 'h3';
import { createReadStream, existsSync, readdirSync } from 'fs';
import { join } from 'path';
import { lookup } from 'mime-types';

export default defineEventHandler(async (event) => {
  const store = getRouterParam(event, 'store') || '';
  const fileId = getRouterParam(event, 'fileId') || '';
  const projectPath = process.env.PROJECT_PATH;

  if (!projectPath) throw createError({ statusCode: 500, statusMessage: 'PROJECT_PATH not set' });

  if (store === 'loc-project') {
    // Search in attachments directory for the file
    const attachDir = join(projectPath, 'attachments');
    if (!existsSync(attachDir)) throw createError({ statusCode: 404, statusMessage: 'File not found' });

    // Find file by fileId prefix
    const files = readdirSync(attachDir);
    const match = files.find(f => f.startsWith(fileId));
    if (!match) throw createError({ statusCode: 404, statusMessage: 'File not found' });

    const filePath = join(attachDir, match);
    const mimeType = lookup(match) || 'application/octet-stream';
    setHeader(event, 'content-type', mimeType);
    setHeader(event, 'cache-control', 'public, max-age=31536000');
    return sendStream(event, createReadStream(filePath));
  }

  // For other stores (cloud IMS), proxy to ims.cr5.space
  throw createError({ statusCode: 404, statusMessage: `Unknown store: ${store}` });
});

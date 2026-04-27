import { defineEventHandler, readRawBody, createError } from 'h3';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { createHash, randomUUID } from 'crypto';
import { getProjectDb } from '../../utils/project-db';
import { autoCommit } from '../../utils/gpt-helpers';

function readLargeBody(event: any, maxSize: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    let size = 0;
    const req = event.node.req;
    req.on('data', (chunk: Buffer) => {
      size += chunk.length;
      if (size > maxSize) {
        req.destroy();
        reject(createError({ statusCode: 413, statusMessage: 'Request body too large (max 10MB)' }));
      }
      chunks.push(chunk);
    });
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
}

export default defineEventHandler(async (event) => {
  const contentLength = event.node.req.headers['content-length'];
  const raw = await readLargeBody(event, 10 * 1024 * 1024);
  console.log(`[set-image] Content-Length header: ${contentLength}, raw body size: ${raw.length}`);
  const body = JSON.parse(raw);
  const { id, url, base64, filename } = body;
  console.log(`[set-image] body.base64 length: ${base64?.length ?? 'none'}, body keys: ${Object.keys(body).join(', ')}`);

  if (!id) throw createError({ statusCode: 400, statusMessage: 'Asset id required' });
  if (!url && !base64) throw createError({ statusCode: 400, statusMessage: 'Either url or base64 image data required' });

  const projectPath = process.env.PROJECT_PATH;
  if (!projectPath) throw createError({ statusCode: 500, statusMessage: 'PROJECT_PATH not set' });

  let imageData: Buffer;
  let ext = '.png';

  if (base64) {
    // Accept raw base64 or data URI (data:image/png;base64,...)
    let raw = base64.replace(/^data:image\/[^;]+;base64,/, '');
    // Strip whitespace, newlines, and fix URL-safe base64
    raw = raw.replace(/[\s\r\n]+/g, '').replace(/-/g, '+').replace(/_/g, '/');
    // Add padding if needed
    while (raw.length % 4 !== 0) raw += '=';

    imageData = Buffer.from(raw, 'base64');
    console.log(`[set-image] base64 input length: ${base64.length}, decoded size: ${imageData.length}, first bytes: ${imageData.subarray(0, 8).toString('hex')}`);

    if (base64.includes('image/jpeg') || base64.includes('image/jpg')) ext = '.jpg';
    else if (base64.includes('image/webp')) ext = '.webp';
  } else {
    // Download from URL
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const contentType = response.headers.get('content-type') || '';
      imageData = Buffer.from(await response.arrayBuffer());
      if (contentType.includes('jpeg') || contentType.includes('jpg')) ext = '.jpg';
      else if (contentType.includes('webp')) ext = '.webp';
    } catch (err: any) {
      throw createError({ statusCode: 400, statusMessage: `Failed to download image: ${err.message}` });
    }
  }

  // Validate image data
  const PNG_MAGIC = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);
  const JPEG_MAGIC = Buffer.from([0xFF, 0xD8, 0xFF]);
  const WEBP_MAGIC = Buffer.from('RIFF');
  if (!imageData.subarray(0, 8).equals(PNG_MAGIC) &&
      !imageData.subarray(0, 3).equals(JPEG_MAGIC) &&
      !imageData.subarray(0, 4).equals(WEBP_MAGIC)) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid image data - not a recognized image format (PNG, JPEG, or WebP)' });
  }

  // Generate file metadata
  const hash = createHash('md5').update(imageData).digest('hex');
  const fileId = [hash.slice(0, 8), hash.slice(8, 12), hash.slice(12, 16), hash.slice(16, 20), hash.slice(20)].join('-');
  const title = filename || `image-${randomUUID()}${ext}`;

  // Save to attachments
  const attachDir = join(projectPath, 'attachments');
  await mkdir(attachDir, { recursive: true });
  await writeFile(join(attachDir, `${fileId}-${title}`), imageData);

  // Update the asset's gallery block
  const db = await getProjectDb();
  const fileValue = { FileId: fileId, Title: title, Size: imageData.length, Dir: 'attachments', Store: 'loc-project' };

  await db.asset.assetsChange({
    where: { id },
    set: {
      blocks: {
        'gallery': {
          type: 'gallery',
          props: {
            'main\\value': fileValue,
            'main\\type': 'file',
          },
        },
      },
    },
  });

  await autoCommit(`Set image on ${id}`);

  return { success: true, file: fileValue };
});

import { defineEventHandler, readBody, createError } from 'h3';
import { writeFile, readFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';
import { createHash, randomUUID } from 'crypto';
import { getProjectDb } from '../../utils/project-db';
import { autoCommit } from '../../utils/gpt-helpers';

// Temporary storage for in-progress uploads
const CHUNK_DIR = '/tmp/ims-image-chunks';

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const { id, chunk, index, total, uploadId, filename } = body;

  if (!id) throw createError({ statusCode: 400, statusMessage: 'Asset id required' });
  if (!uploadId) throw createError({ statusCode: 400, statusMessage: 'uploadId required' });
  if (chunk === undefined || index === undefined || total === undefined) {
    throw createError({ statusCode: 400, statusMessage: 'chunk, index, and total are required' });
  }

  await mkdir(CHUNK_DIR, { recursive: true });

  // Save this chunk
  const chunkPath = join(CHUNK_DIR, `${uploadId}-${index}`);
  await writeFile(chunkPath, chunk, 'utf8');
  console.log(`[image-chunk] uploadId=${uploadId} chunk ${index + 1}/${total} received (${chunk.length} chars)`);

  // Check if all chunks are in
  const receivedChunks: string[] = [];
  for (let i = 0; i < total; i++) {
    const p = join(CHUNK_DIR, `${uploadId}-${i}`);
    if (!existsSync(p)) {
      // Not all chunks yet
      return { success: true, status: 'partial', received: index + 1, total };
    }
  }

  // All chunks received - reassemble
  for (let i = 0; i < total; i++) {
    const p = join(CHUNK_DIR, `${uploadId}-${i}`);
    receivedChunks.push(await readFile(p, 'utf8'));
  }
  let raw = receivedChunks.join('');

  // Clean up chunk files
  for (let i = 0; i < total; i++) {
    const p = join(CHUNK_DIR, `${uploadId}-${i}`);
    try { await readFile(p).then(() => writeFile(p, '')); } catch {}
  }

  // Decode base64
  raw = raw.replace(/^data:image\/[^;]+;base64,/, '');
  raw = raw.replace(/[\s\r\n]+/g, '').replace(/-/g, '+').replace(/_/g, '/');
  while (raw.length % 4 !== 0) raw += '=';

  const imageData = Buffer.from(raw, 'base64');
  console.log(`[image-chunk] uploadId=${uploadId} reassembled: ${receivedChunks.join('').length} chars base64 -> ${imageData.length} bytes`);

  // Validate
  const PNG_MAGIC = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);
  const JPEG_MAGIC = Buffer.from([0xFF, 0xD8, 0xFF]);
  const WEBP_MAGIC = Buffer.from('RIFF');
  if (!imageData.subarray(0, 8).equals(PNG_MAGIC) &&
      !imageData.subarray(0, 3).equals(JPEG_MAGIC) &&
      !imageData.subarray(0, 4).equals(WEBP_MAGIC)) {
    throw createError({ statusCode: 400, statusMessage: `Invalid image data after reassembly (${imageData.length} bytes, first bytes: ${imageData.subarray(0, 8).toString('hex')})` });
  }

  // Detect extension
  let ext = '.png';
  if (imageData.subarray(0, 3).equals(JPEG_MAGIC)) ext = '.jpg';
  else if (imageData.subarray(0, 4).equals(WEBP_MAGIC)) ext = '.webp';

  const projectPath = process.env.PROJECT_PATH;
  if (!projectPath) throw createError({ statusCode: 500, statusMessage: 'PROJECT_PATH not set' });

  const hash = createHash('md5').update(imageData).digest('hex');
  const fileId = [hash.slice(0, 8), hash.slice(8, 12), hash.slice(12, 16), hash.slice(16, 20), hash.slice(20)].join('-');
  const title = filename || `image-${randomUUID()}${ext}`;

  const attachDir = join(projectPath, 'attachments');
  await mkdir(attachDir, { recursive: true });
  await writeFile(join(attachDir, `${fileId}-${title}`), imageData);

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

  return { success: true, status: 'complete', file: fileValue };
});

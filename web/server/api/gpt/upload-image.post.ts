import { defineEventHandler, readMultipartFormData, createError } from 'h3';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { createHash, randomUUID } from 'crypto';
import { getProjectDb } from '../../utils/project-db';
import { autoCommit } from '../../utils/gpt-helpers';

export default defineEventHandler(async (event) => {
  const parts = await readMultipartFormData(event);
  if (!parts || parts.length === 0) {
    throw createError({ statusCode: 400, statusMessage: 'No multipart data received' });
  }

  let id: string | undefined;
  let filename: string | undefined;
  let imageData: Buffer | undefined;

  for (const part of parts) {
    if (part.name === 'id') {
      id = part.data.toString('utf8').trim();
    } else if (part.name === 'filename') {
      filename = part.data.toString('utf8').trim();
    } else if (part.name === 'file') {
      imageData = part.data;
      if (!filename && part.filename) {
        filename = part.filename;
      }
    }
  }

  if (!id) throw createError({ statusCode: 400, statusMessage: 'Asset id required (pass as form field "id")' });
  if (!imageData || imageData.length === 0) throw createError({ statusCode: 400, statusMessage: 'No file data received (pass as form field "file")' });

  // Validate image
  const PNG_MAGIC = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);
  const JPEG_MAGIC = Buffer.from([0xFF, 0xD8, 0xFF]);
  const WEBP_MAGIC = Buffer.from('RIFF');
  if (!imageData.subarray(0, 8).equals(PNG_MAGIC) &&
      !imageData.subarray(0, 3).equals(JPEG_MAGIC) &&
      !imageData.subarray(0, 4).equals(WEBP_MAGIC)) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid image data - not a recognized image format (PNG, JPEG, or WebP)' });
  }

  const projectPath = process.env.PROJECT_PATH;
  if (!projectPath) throw createError({ statusCode: 500, statusMessage: 'PROJECT_PATH not set' });

  // Detect extension
  let ext = '.png';
  if (imageData.subarray(0, 3).equals(JPEG_MAGIC)) ext = '.jpg';
  else if (imageData.subarray(0, 4).equals(WEBP_MAGIC)) ext = '.webp';

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

  return { success: true, file: fileValue };
});

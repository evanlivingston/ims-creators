import { defineEventHandler, readBody, createError } from 'h3';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { createHash, randomUUID } from 'crypto';
import { getProjectDb } from '../../utils/project-db';
import { autoCommit } from '../../utils/gpt-helpers';

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const { id, url, base64, filename } = body;

  if (!id) throw createError({ statusCode: 400, statusMessage: 'Asset id required' });
  if (!url && !base64) throw createError({ statusCode: 400, statusMessage: 'Either url or base64 image data required' });

  const projectPath = process.env.PROJECT_PATH;
  if (!projectPath) throw createError({ statusCode: 500, statusMessage: 'PROJECT_PATH not set' });

  let imageData: Buffer;
  let ext = '.png';

  if (base64) {
    // Accept raw base64 or data URI (data:image/png;base64,...)
    const raw = base64.replace(/^data:image\/\w+;base64,/, '');
    imageData = Buffer.from(raw, 'base64');
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

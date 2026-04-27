import { defineEventHandler, readBody, createError } from 'h3';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { createHash, randomUUID } from 'crypto';
import { getProjectDb } from '../../utils/project-db';
import { autoCommit } from '../../utils/gpt-helpers';

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const { id, url } = body;

  if (!id) throw createError({ statusCode: 400, statusMessage: 'Asset id required' });
  if (!url) throw createError({ statusCode: 400, statusMessage: 'Image url required' });

  const projectPath = process.env.PROJECT_PATH;
  if (!projectPath) throw createError({ statusCode: 500, statusMessage: 'PROJECT_PATH not set' });

  // Download the image
  let imageData: Buffer;
  let contentType: string;
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    contentType = response.headers.get('content-type') || 'image/png';
    imageData = Buffer.from(await response.arrayBuffer());
  } catch (err: any) {
    throw createError({ statusCode: 400, statusMessage: `Failed to download image: ${err.message}` });
  }

  // Generate file metadata
  const hash = createHash('md5').update(imageData).digest('hex');
  const fileId = [hash.slice(0, 8), hash.slice(8, 12), hash.slice(12, 16), hash.slice(16, 20), hash.slice(20)].join('-');
  const ext = contentType.includes('png') ? '.png' : contentType.includes('jpeg') || contentType.includes('jpg') ? '.jpg' : contentType.includes('webp') ? '.webp' : '.png';
  const title = `image-${randomUUID()}${ext}`;

  // Save to attachments
  const attachDir = join(projectPath, 'attachments');
  await mkdir(attachDir, { recursive: true });
  await writeFile(join(attachDir, `${fileId}-${title}`), imageData);

  // Update the asset's gallery block
  const db = await getProjectDb();
  const fileValue = { FileId: fileId, Title: title, Size: imageData.length, Dir: 'attachments', Store: 'loc-project' };

  // Set the gallery block's main image
  await db.asset.assetsChange({
    where: { id },
    set: {
      blocks: {
        'gallery': {
          type: 'gallery',
          props: {
            main: { type: 'file', index: 1, value: fileValue },
          },
        },
      },
    },
  });

  await autoCommit(`Set image on ${id}`);

  return { success: true, file: fileValue };
});

import { defineEventHandler, readMultipartFormData, createError } from 'h3';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { createHash, randomUUID } from 'crypto';

export default defineEventHandler(async (event) => {
  const formData = await readMultipartFormData(event);
  if (!formData || formData.length === 0) {
    throw createError({ statusCode: 400, statusMessage: 'No file uploaded' });
  }

  const filePart = formData.find(p => p.name === 'file');
  if (!filePart || !filePart.data) {
    throw createError({ statusCode: 400, statusMessage: 'No file field in form data' });
  }

  const projectPath = process.env.PROJECT_PATH;
  if (!projectPath) throw createError({ statusCode: 500, statusMessage: 'PROJECT_PATH not set' });

  // Generate FileId from content hash
  const hash = createHash('md5').update(filePart.data).digest('hex');
  const fileId = [hash.slice(0, 8), hash.slice(8, 12), hash.slice(12, 16), hash.slice(16, 20), hash.slice(20)].join('-');

  const title = filePart.filename || `file-${randomUUID()}`;
  const store = 'loc-project';
  const dir = 'attachments';

  // Save file to attachments directory
  const attachDir = join(projectPath, dir);
  await mkdir(attachDir, { recursive: true });
  const filePath = join(attachDir, `${fileId}-${title}`);
  await writeFile(filePath, filePart.data);

  return {
    FileId: fileId,
    Title: title,
    Size: filePart.data.length,
    Dir: dir,
    Store: store,
  };
});

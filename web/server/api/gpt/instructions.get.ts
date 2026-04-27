import { defineEventHandler, setHeader } from 'h3';
import { readFileSync } from 'fs';
import { resolve } from 'path';

let cached: string | null = null;

export default defineEventHandler((event) => {
  setHeader(event, 'content-type', 'text/markdown');
  setHeader(event, 'access-control-allow-origin', '*');
  if (!cached) {
    for (const p of [
      resolve(process.cwd(), 'gpt-instructions.md'),
      resolve(process.cwd(), '..', 'gpt-instructions.md'),
      resolve(process.cwd(), 'web', 'gpt-instructions.md'),
    ]) {
      try { cached = readFileSync(p, 'utf-8'); break; } catch {}
    }
    if (!cached) cached = '# instructions not found';
  }
  return cached;
});

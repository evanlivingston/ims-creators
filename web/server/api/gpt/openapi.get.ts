import { defineEventHandler, setHeader } from 'h3';
import { readFileSync } from 'fs';
import { resolve } from 'path';

let cached: string | null = null;

export default defineEventHandler((event) => {
  setHeader(event, 'content-type', 'text/yaml');
  setHeader(event, 'access-control-allow-origin', '*');
  if (!cached) {
    for (const p of [
      resolve(process.cwd(), 'openapi-gpt.yaml'),
      resolve(process.cwd(), '..', 'openapi-gpt.yaml'),
      resolve(process.cwd(), 'web', 'openapi-gpt.yaml'),
    ]) {
      try { cached = readFileSync(p, 'utf-8'); break; } catch {}
    }
    if (!cached) cached = '# openapi-gpt.yaml not found';
  }
  return cached;
});

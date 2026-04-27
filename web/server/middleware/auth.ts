import { defineEventHandler, getHeader, createError } from 'h3';

export default defineEventHandler((event) => {
  const path = event.path || '';

  // Only protect /api/ routes
  if (!path.startsWith('/api/')) {
    return;
  }

  // Public endpoints - no auth needed
  if (path === '/api/gpt/openapi' || path === '/api/gpt/instructions') {
    return;
  }

  const apiKey = process.env.API_KEY;

  // If no API_KEY is set, skip auth (local development)
  if (!apiKey) {
    return;
  }

  // Allow requests from the web UI (same origin - browser sends Referer/Origin)
  const origin = getHeader(event, 'origin');
  const referer = getHeader(event, 'referer');
  if (origin || referer) {
    // Request came from a browser on the same site - allow it
    return;
  }

  const providedKey =
    getHeader(event, 'x-api-key') ||
    getHeader(event, 'authorization')?.replace(/^Bearer\s+/, '');

  if (providedKey !== apiKey) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized - invalid or missing API key',
    });
  }
});

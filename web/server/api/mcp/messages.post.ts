import { defineEventHandler, getHeader, getQuery, createError } from 'h3';
import { getSession } from '../../utils/mcp-server';

export default defineEventHandler(async (event) => {
  // Auth check
  const apiKey = process.env.API_KEY;
  if (apiKey) {
    const auth = getHeader(event, 'authorization') || '';
    const provided = auth.replace(/^Bearer\s+/i, '');
    const xKey = getHeader(event, 'x-api-key') || '';
    if (provided !== apiKey && xKey !== apiKey) {
      throw createError({ statusCode: 401, statusMessage: 'Unauthorized' });
    }
  }

  const query = getQuery(event);
  const sessionId = (query.sessionId as string) || '';

  const transport = getSession(sessionId);
  if (!transport) {
    throw createError({ statusCode: 404, statusMessage: 'Session not found' });
  }

  // Pass raw req/res to the transport
  await transport.handlePostMessage(event.node.req, event.node.res);

  event._handled = true;
});

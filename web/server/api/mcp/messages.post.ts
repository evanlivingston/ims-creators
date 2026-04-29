import { defineEventHandler, getHeader, getQuery, createError } from 'h3';
import { getSession } from '../../utils/mcp-server';

export default defineEventHandler(async (event) => {
  // No auth - Claude.ai custom connectors don't support auth headers yet

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

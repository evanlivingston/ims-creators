import { defineEventHandler, getHeader, createError } from 'h3';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import { createMcpSession, storeSession } from '../../utils/mcp-server';

export default defineEventHandler(async (event) => {
  // Auth check - same as main middleware but explicit here since SSE needs special handling
  const apiKey = process.env.API_KEY;
  if (apiKey) {
    const auth = getHeader(event, 'authorization') || '';
    const provided = auth.replace(/^Bearer\s+/i, '');
    const xKey = getHeader(event, 'x-api-key') || '';
    if (provided !== apiKey && xKey !== apiKey) {
      throw createError({ statusCode: 401, statusMessage: 'Unauthorized' });
    }
  }

  // Get the raw Node response object for SSE
  const res = event.node.res;

  const transport = new SSEServerTransport('/api/mcp/messages', res);
  const { server } = createMcpSession();
  storeSession(transport.sessionId, transport);

  await server.connect(transport);

  // Keep the connection open - the transport handles SSE
  // Return nothing to prevent H3 from sending a response
  event._handled = true;
});

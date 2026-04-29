import { defineEventHandler, getHeader, createError } from 'h3';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import { createMcpSession, storeSession } from '../../utils/mcp-server';

export default defineEventHandler(async (event) => {
  // No auth - Claude.ai custom connectors don't support auth headers yet

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

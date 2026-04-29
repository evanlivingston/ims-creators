import { defineEventHandler } from 'h3';
import { handleMcpRequest } from '../../utils/mcp-server';

export default defineEventHandler(async (event) => {
  // Handle all HTTP methods (GET for SSE, POST for messages, DELETE for cleanup)
  await handleMcpRequest(event.node.req, event.node.res);
  event._handled = true;
});

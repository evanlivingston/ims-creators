// Redirect old SSE endpoint to the new streamable HTTP endpoint
import { defineEventHandler, sendRedirect } from 'h3';

export default defineEventHandler(async (event) => {
  return sendRedirect(event, '/api/mcp', 308);
});

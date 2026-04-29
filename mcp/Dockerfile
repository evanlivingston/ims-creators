FROM node:22-slim

WORKDIR /app/mcp
COPY mcp/package.json mcp/package-lock.json* ./
RUN npm install --ignore-scripts
COPY mcp/dist/ ./dist/

CMD ["node", "dist/index.js"]

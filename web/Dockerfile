FROM node:22-slim

WORKDIR /app

# Copy all three layers
COPY ims-app-base/ ./ims-app-base/
COPY creators/ ./creators/
COPY web/ ./web/

# Install deps for each layer
WORKDIR /app/ims-app-base
RUN npm install --ignore-scripts && npx nuxt prepare

WORKDIR /app/creators
RUN npm install --ignore-scripts && npx nuxt prepare

WORKDIR /app/web
RUN npm install --ignore-scripts && npm run build

# Copy spec files to output so they're accessible at runtime
RUN cp openapi-gpt.yaml gpt-instructions.md .output/ 2>/dev/null || true

WORKDIR /app/web/.output

EXPOSE 3000

ENV HOST=0.0.0.0
ENV PORT=3000

CMD ["node", ".output/server/index.mjs"]

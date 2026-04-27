FROM node:22-slim

RUN apt-get update && apt-get install -y git && rm -rf /var/lib/apt/lists/* \
    && git config --global --add safe.directory '*'

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

# Spec files stay in /app/web/ (process.cwd()) for runtime access

EXPOSE 3000

ENV HOST=0.0.0.0
ENV PORT=3000
ENV GIT_AUTHOR_NAME="IMS Creators"
ENV GIT_AUTHOR_EMAIL="ims@sieisst.com"
ENV GIT_COMMITTER_NAME="IMS Creators"
ENV GIT_COMMITTER_EMAIL="ims@sieisst.com"

CMD ["sh", "-c", "git config --global --add safe.directory /data/design && node .output/server/index.mjs"]

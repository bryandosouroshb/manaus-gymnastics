# Node base image with small footprint
FROM node:20-slim

# Install ffmpeg and ca-certificates (keeps image small)
RUN apt-get update \
  && apt-get install -y --no-install-recommends ffmpeg ca-certificates \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /usr/src/app

# Copy package files and install production dependencies
COPY package*.json ./
# Use `npm install` when there's no package-lock.json available (safer for build servers)
RUN npm install --omit=dev --no-audit --no-fund

# Copy app source
COPY . .

# Default port (can be overridden by env)
ENV PORT=4000
EXPOSE 4000

# Start the proxy
CMD ["node", "rtmp-proxy.js"]

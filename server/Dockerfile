# Node base image with small footprint
FROM node:20-slim

# Install ffmpeg and ca-certificates (keeps image small)
RUN apt-get update \
  && apt-get install -y --no-install-recommends ffmpeg ca-certificates \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /usr/src/app

# Copy package files and install production dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy app source
COPY . .

# Default port (can be overridden by env)
ENV PORT=4000
EXPOSE 4000

# Start the proxy
CMD ["node", "rtmp-proxy.js"]

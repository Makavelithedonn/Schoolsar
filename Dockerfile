FROM node:18-slim

# Create app directory (we'll run from backend folder)
WORKDIR /app/backend

# Install system deps needed for optional native modules (sqlite build)
RUN apt-get update && apt-get install -y python3 build-essential libsqlite3-dev --no-install-recommends && rm -rf /var/lib/apt/lists/*

# Copy backend package manifest and install dependencies
COPY backend/package.json backend/package-lock.json* ./
RUN npm install --production

# Copy rest of the project
COPY . /app

ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

CMD ["node", "src/app.js"]

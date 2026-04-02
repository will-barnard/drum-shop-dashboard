# -- Stage 1: Build the Vue client --
FROM node:20-alpine AS client-build
WORKDIR /build/client
COPY client/package.json client/package-lock.json ./
RUN npm install
COPY client/ ./
RUN npm run build

# -- Stage 2: Production server --
FROM node:20-alpine
WORKDIR /app

# Install server dependencies
COPY server/package.json server/package-lock.json ./server/
RUN cd server && npm install --omit=dev

# Copy server source
COPY server/ ./server/

# Copy built client
COPY --from=client-build /build/client/dist ./client/dist/

# .env and SQLite DB are mounted at runtime

EXPOSE 3000

CMD ["sh", "-c", "node server/seed.js && node server/index.js"]

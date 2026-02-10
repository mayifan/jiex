# Build stage
FROM node:18-alpine AS build-stage
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Production stage
FROM node:18-alpine AS production-stage
WORKDIR /app
ENV NODE_ENV=production

COPY package*.json ./
RUN npm install --omit=dev

COPY --from=build-stage /app/dist ./dist
COPY --from=build-stage /app/server ./server

EXPOSE 8080
CMD ["npm", "run", "start"]

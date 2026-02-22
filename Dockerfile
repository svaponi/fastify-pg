FROM node:20-alpine AS builder
COPY package*.json ./
RUN npm install
COPY ./tsconfig.json ./tsconfig.json
COPY ./src ./src
RUN npx tsc

FROM node:20-alpine AS production
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm install --production
COPY --from=builder node_modules ./node_modules
COPY --from=builder dist ./dist
COPY --from=builder src/schema.sql ./dist/schema.sql
ENV NODE_ENV=production
ENV PORT=5000
EXPOSE $PORT
CMD ["node", "dist/index.js"]

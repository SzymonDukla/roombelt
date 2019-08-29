FROM node:10.15.1

RUN mkdir /roombook

WORKDIR /roombook

COPY package.json package-lock.json index.js .env ./
COPY backend backend/
COPY frontend frontend/

RUN npm install && \
    npm run build:frontend && \
    npm prune --production

EXPOSE 3000

ENV NODE_ENV=production

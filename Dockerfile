FROM node:10.15.1

RUN mkdir /roombelt

WORKDIR /roombelt

COPY package.json package-lock.json index.js LICENSE.txt README.md ./
COPY backend backend/
COPY frontend frontend/

RUN npm install && \
    npm run build:frontend && \
    npm prune --production

EXPOSE 3000

ENV NODE_ENV=production

FROM node:10.15.1

RUN mkdir /roombook

WORKDIR /roombook

COPY . .

RUN npm install --silent && \
    npm run build:frontend && \
    npm prune --production

EXPOSE 3000

ENV NODE_ENV=production

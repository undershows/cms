ARG NODE_VERSION=20-alpine

FROM node:${NODE_VERSION} AS deps
WORKDIR /app

RUN corepack enable || true

COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile

FROM node:${NODE_VERSION} AS build
WORKDIR /app

RUN corepack enable || true

COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NODE_OPTIONS=--max_old_space_size=4096
RUN yarn build

FROM node:${NODE_VERSION} AS runtime
WORKDIR /app

ENV NODE_ENV=production
ENV TZ=America/Sao_Paulo

RUN addgroup -S strapi && adduser -S strapi -G strapi

COPY --from=build --chown=strapi:strapi /app /app

USER strapi

EXPOSE 1337

CMD ["node", "node_modules/@strapi/strapi/bin/strapi.js", "start"]


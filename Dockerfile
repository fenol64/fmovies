FROM node:22-alpine
WORKDIR /app

RUN apk add --no-cache libc6-compat openssl

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

ENV NEXT_TELEMETRY_DISABLED=1
ENV DATABASE_URL=postgresql://fmovies:fmovies@db:5432/fmovies
ENV AUTH_SECRET=build-placeholder-not-used-at-runtime

RUN npm run build

EXPOSE 3000
ENV NODE_ENV=production

RUN chmod +x /app/docker-entrypoint.sh
ENTRYPOINT ["/app/docker-entrypoint.sh"]

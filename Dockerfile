# One image for every service. Each deployment picks the app to run with the
# APP variable (see scripts/start-service.sh), e.g. APP=api-gateway.

FROM node:22-bookworm-slim AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build:all

FROM node:22-bookworm-slim
ENV NODE_ENV=production
WORKDIR /app
# Dev dependencies stay: the pre-deploy step (scripts/setup-db.mjs) needs
# drizzle-kit and dotenv, and builds an empty database from the TypeScript
# schemas under libs/.
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/package.json /app/tsconfig.json ./
COPY --from=build /app/dist ./dist
COPY --from=build /app/libs ./libs
COPY --from=build /app/migrations ./migrations
COPY --from=build /app/scripts ./scripts
USER node
CMD ["sh", "scripts/start-service.sh"]

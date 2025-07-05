FROM node:20 AS base

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

FROM base AS development

EXPOSE 5173
CMD ["npm", "run", "dev", "--", "--host"]

FROM base AS build

ARG VITE_API_URL
ARG VITE_SENTRY_DSN
ARG SENTRY_ORG
ARG SENTRY_PROJECT
ARG SENTRY_AUTH_TOKEN

ENV VITE_API_URL=$VITE_API_URL
ENV VITE_SENTRY_DSN=$VITE_SENTRY_DSN
ENV SENTRY_ORG=$SENTRY_ORG
ENV SENTRY_PROJECT=$SENTRY_PROJECT
ENV SENTRY_AUTH_TOKEN=$SENTRY_AUTH_TOKEN

RUN npm run build

FROM node:20 AS production

WORKDIR /app
# prod stage depends on the build stage, and copies the dist folder from build and put it on 
# prod stage (minimal production setup)
COPY --from=build /app/dist ./dist
RUN npm install -g serve

EXPOSE 4173
CMD ["serve", "-s", "dist", "-l", "4173"]
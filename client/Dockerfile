FROM node:20 AS base

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

FROM base AS development

EXPOSE 5173
CMD ["npm", "run", "dev", "--", "--host"]

FROM base AS build

RUN npm run build
RUN npm install -g serve

FROM node:20 AS production

WORKDIR /app
# prod stage depends on the build stage, and copies the dist folder from build and put it on 
# prod stage (minimal production setup)
COPY --from=build /app/dist ./dist
RUN npm install -g serve

EXPOSE 4173
CMD ["serve", "-s", "dist", "-l", "4173"]
# Base stage with dependencies installed
FROM node:20 AS base

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .


# Development stage: runs dev server
FROM base AS development

EXPOSE 3001
CMD ["npm", "run", "dev"]


# Production stage: runs production server
FROM base AS production

EXPOSE 3001
CMD ["npm", "run", "start"]
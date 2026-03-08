FROM node:22-alpine AS base
WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm install

COPY . .
RUN npm run build

EXPOSE 4000
CMD ["npm", "run", "start"]

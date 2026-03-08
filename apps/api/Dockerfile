FROM node:22-alpine
WORKDIR /app

COPY package.json ./
RUN npm install

COPY . .
RUN npm --workspace apps/api exec prisma generate
RUN npm run build

# Create a non-root user and group for running the app
RUN addgroup -S nodejs && adduser -S nodejs -G nodejs && chown -R nodejs:nodejs /app

# Run the application as the non-root user
USER nodejs
EXPOSE 4000
CMD ["npm", "run", "start"]

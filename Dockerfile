FROM node:20-alpine

# Set working directory
WORKDIR /app

# Set production environment
ENV NODE_ENV=production

# Copy files
COPY package*.json ./
RUN npm install --omit=dev

COPY . .

# Expose port
EXPOSE 8003

# Start app
CMD ["npm", "start"]
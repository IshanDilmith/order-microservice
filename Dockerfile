FROM node:24-slim

# Set working directory
WORKDIR /app

# Copy files
COPY package*.json ./
RUN npm install

COPY . .

# Expose port
EXPOSE 8003

# Start app
CMD ["npm", "start"]
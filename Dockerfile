# Base image
FROM node:16-alpine

# Set working directory
WORKDIR /usr/src/app

# Copy package files
COPY package*.json ./
COPY backend/package*.json ./backend/

# Install dependencies
RUN npm install
RUN cd backend && npm install

# Copy app files
COPY . .

# Build frontend
RUN npm run build

# Set environment variables
ENV PORT=3001
ENV NODE_ENV=production

# Create volume for SQLite database
VOLUME /usr/src/app/backend/data

# Expose ports
EXPOSE 3000 3001

# Create start script
COPY docker-start.sh .
RUN chmod +x docker-start.sh

# Start the application
CMD ["./docker-start.sh"]

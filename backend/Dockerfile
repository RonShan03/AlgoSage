# Use a slim Node.js base image
FROM node:20-alpine AS build

# Set the working directory
WORKDIR /app/backend

# Copy package.json and package-lock.json first to leverage Docker cache
COPY package.json package-lock.json ./

# Install Node.js dependencies
RUN npm install

# Copy the rest of the backend source code
COPY . .

# Expose the port your Node.js application listens on (e.g., 3000 or 8080)
EXPOSE 3000

# Command to run the Node.js application
CMD ["node", "testbackend.js"]

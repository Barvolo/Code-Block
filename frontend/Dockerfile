# Use an official Node.js runtime as a parent image
FROM node:14

# Set the working directory to /app
WORKDIR /app

# Copy package.json and package-lock.json into the container
COPY package.json package-lock.json ./

# Install any needed packages
RUN npm install

# Copy the current directory contents into the container
COPY . .

# Build the app for production to the build folder
RUN npm run build

# Install serve to serve the build folder
RUN npm install -g serve

# Make port 3000 available to the world outside this container
EXPOSE 3000

# Serve the build folder
CMD ["serve", "-s", "build"]


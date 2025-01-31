FROM node:18-alpine

# Install curl
RUN apk add --no-cache curl

# Set the working directory in the container
WORKDIR /app

# Copy package.json and package-lock.json to install dependencies
COPY package*.json ./

# Install dependencies
RUN npm install --production

# Copy the rest of the application
COPY . .

# Set environment variables for the port and host
ENV PORT=3002
ENV HOST=0.0.0.0

# Expose port 3002
EXPOSE 3002

# Run the application
CMD ["npm", "run", "dev"]

FROM node:18-alpine

# Install curl
RUN apk add --no-cache curl

# Set the working directory in the container
WORKDIR /app

# Copy workspace and package files
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json .npmrc ./
COPY frontend/package.json frontend/

# Install dependencies without running scripts
RUN corepack enable && pnpm install --filter frontend --frozen-lockfile --ignore-scripts --prod

# Copy the rest of the application
COPY frontend ./frontend

# Set environment variables for the port and host
ENV PORT=3002
ENV HOST=0.0.0.0

# Expose port 3002
EXPOSE 3002

HEALTHCHECK CMD curl -f http://localhost:3002/health || exit 1

# Run the application
CMD ["pnpm", "--filter", "frontend", "run", "dev"]

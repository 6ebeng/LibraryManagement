FROM cypress/included:14.4.1 AS base

WORKDIR /app
COPY package*.json ./
RUN npm ci --production=false

# Test stage for running end-to-end tests
FROM base AS production
COPY . .
ENTRYPOINT ["/bin/bash", "-c", "trap : TERM INT; sleep infinity & wait"]

# Development stage for interactive development (e.g., e2e-runner-watch service)
FROM base AS development
COPY . .
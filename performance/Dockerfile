# Use the official k6 image as a parent image
FROM grafana/k6:latest

# Set the working directory in the container
WORKDIR /app

# Copy the performance test script into the container
COPY performance-test.js .

# The command to run the test will be provided by docker-compose
ENTRYPOINT ["k6"]
#!/bin/sh

# Start backend
node /app/src/index.js &

# Start nginx
nginx

# Keep container running
wait

# Single container build - combines frontend and backend
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package.json ./
RUN npm install
COPY frontend/ ./
RUN npm run build

FROM node:20-alpine
WORKDIR /app

# Install nginx
RUN apk add --no-cache nginx

# Copy backend
COPY backend/package.json ./
RUN npm install --production
COPY backend/src ./src

# Copy frontend build
COPY --from=frontend-builder /app/frontend/dist /usr/share/nginx/html

# Copy nginx config
COPY docker/nginx-single.conf /etc/nginx/nginx.conf

# Copy startup script
COPY docker/start.sh /start.sh
RUN chmod +x /start.sh

EXPOSE 80 3001

CMD ["/start.sh"]

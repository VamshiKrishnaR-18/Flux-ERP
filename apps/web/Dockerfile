FROM node:18-alpine AS builder

WORKDIR /app
RUN corepack enable

COPY package.json package-lock.json turbo.json ./
COPY packages ./packages
COPY apps/web ./apps/web

RUN npm install
# Build the Web App
# We need to pass API URL arg if we want it baked in, but usually we use env vars at runtime or relative paths
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

RUN npx turbo run build --filter=web...

# Production Stage with Nginx
FROM nginx:alpine

COPY --from=builder /app/apps/web/dist /usr/share/nginx/html
COPY apps/web/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]

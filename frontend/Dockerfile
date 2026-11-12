# ==============================================================================
# 1. BUILD STAGE (Node 20 Alpine)
# ==============================================================================
FROM node:20-alpine AS builder

WORKDIR /app

# Argument de build permettant d'utiliser le reverse-proxy Nginx (/api) sur un VPS
ARG VITE_API_URL=/api
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_API_BASE_URL=$VITE_API_URL

# Copie des manifests de packages pour le cache
COPY package.json package-lock.json ./
RUN npm ci

# Copie des sources et build Vite
COPY . ./
RUN npm run build

# ==============================================================================
# 2. SERVING STAGE (Nginx Alpine ultra-léger ~25 Mo)
# ==============================================================================
FROM nginx:alpine AS runner

# Copie de la configuration Nginx avec reverse-proxy et SPA routing
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copie des assets compilés depuis le builder
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]

# --- Stage 1: Backend Build & OpenAPI Generierung ---
FROM maven:3.9.16-eclipse-temurin-25-alpine AS backend-build

WORKDIR /usr/app
COPY ./ /usr/app

# 1. OpenAPI Spec generieren
RUN mvn clean verify -ntp -DskipTests -Pgenerate-api

# --- Stage 2: Angular Client Generation ---
FROM openapitools/openapi-generator-cli:v7.19.0 AS client-gen

ARG API_CLIENT_VERSION=1.0.5
ARG NPM_NAME=@backend/api-client
ARG NG_VERSION=19.1.0

COPY --from=backend-build /usr/app/target/openapi.json /local/openapi.json
RUN echo "$API_CLIENT_VERSION" > /local/version.txt

# 2. Generierung des Angular-Clients
RUN /usr/local/bin/docker-entrypoint.sh generate \
    -i /local/openapi.json \
    -g typescript-angular \
    -o /local/out \
    --additional-properties=npmName=$NPM_NAME \
    --additional-properties=npmVersion=$(cat /local/version.txt) \
    --additional-properties=ngVersion=$NG_VERSION

# --- Stage 3: Pack Library (.tgz) ---
FROM node:24.13.0-alpine3.23 AS package

WORKDIR /build
COPY --from=client-gen /local/out /build/

RUN npm install && \
    npm run build

WORKDIR /build/dist
RUN npm pack

# --- Stage 4: Export des .tgz-Archivs ---
FROM alpine:latest AS export

WORKDIR /export
COPY --from=package /build/dist/*.tgz /export/

CMD ["sh", "-c", "cp /export/*.tgz /target/ && echo 'NPM Package (.tgz) erfolgreich exportiert!'"]
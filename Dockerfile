# build environment
FROM node:16.14.0-alpine as build

WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .

EXPOSE 3000
CMD [ "node", "main.mjs" ]
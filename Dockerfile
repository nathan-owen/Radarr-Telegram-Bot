FROM node:latest

RUN mkdir /app

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . ./

VOLUME [ "/config" ]

CMD ["npm", "start"]

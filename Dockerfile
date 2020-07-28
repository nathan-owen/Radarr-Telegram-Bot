FROM node:latest

RUN mkdir /app

WORKDIR /app

ENV TELEGRAM_BOTTOKEN="BotToken" \
BOT_PASSWORD="Telegram Bot Password" \
BOT_OWNER=0 \
RADARR_HOST="IP or URL of Radarr Host" \
RADARR_APIKEY="API Key for Radarr" \
RADARR_PORT=7878 \
RADARR_URLBASE="/" \
RADARR_SSL=false \
RADARR_USERNAME="Username to login to Radarr" \ 
RADARR_PASSWORD="Password to login to Radarr" \
DEFAULTS_ROOT_FOLDER="Root Folder to download media by default" \
DEFAULTS_PROFILE_ID=0 \
DEFAULTS_MONITOR=true 

COPY package*.json ./
RUN npm install

COPY . ./

CMD ["npm", "start"]

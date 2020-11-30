

# Radarr Telegram Bot

Bot which lets you or others add series to [Radarr](https://radarr.video/) via the messaging service [Telegram](https://telegram.org/).

Contact [@BotFather](http://telegram.me/BotFather) on Telegram to create and get a bot token.

## [Donate](https://www.paypal.com/donate?hosted_button_id=CCJFF8PUWPTNU)
If you find this bot helpful in any way and feel like it, donations are greatly appreciated!
[Donate Here](https://www.paypal.com/donate?hosted_button_id=CCJFF8PUWPTNU)

Getting Started
---------------

## Prerequisites
- [Node.js](http://nodejs.org)
- [Git](https://git-scm.com/downloads) (optional)

## Installation

```bash
# Clone the repository
git clone https://github.com/nathan-owen/radarr-telegram-bot
```

```bash
# Install dependencies
cd radarr-telegram-bot
npm install
```

```bash
# Copy acl.json.template to acl.json
cp acl.json.template acl.json
```

```bash
# Copy config.json.template to config.json
cp config.json.template config.json
```

In `config.json` fill in the values below:

Telegram:
- **botToken** your Telegram Bot token

Bot:
- **password** the password to access the bot
- **owner** your Telegram user ID. (See below how to get your telegram ID)
- **notifyId** Telegram ID used for notifications. (optional; you can fill this in later)

Radarr:
- **hostname**: hostname where Radarr runs (required)
- **apiKey**: Your API to access Radarr (required)
- **port**: port number Radarr is listening on (optional, default: 5050)
- **urlBase**: URL Base of Radarr (optional, default: empty)
- **ssl**: Set to true if you are connecting via SSL (default: false)
- **username**: HTTP Auth username (default: empty)
- **password**: HTTP Auth password (default: empty)

Defaults:
- **rootFolder**: The default path used for storing movies. This is the "Root Folder" listed when you add a movie using the web interface
- **profileID**: the number representing the quality profile you want to use for the movie. The simplest way to get the number is to go through the workflow to add a movie using the bot and count the profiles listed. For example the "Any" profile is always 1
- **monitor**: true or false. This is if you want to have radarr monitor the movie (you almost always want this true)

**Important note**: Restart the bot after making any changes to the `config.json` file.

```bash
# Start the bot
node radarr.js
```
## How to get Telegram User ID
In Telegram, go to chat with [@my_id_bot](https://t.me/my_id_bot) and it will give you the telegram id.

## Usage (commands)

### First use
Send the bot the `/auth` command with the password you created in `config.json`

### Adding a Movie

Send the bot a message with the Movie name

`/q Rambo`

The bot will reply with

```
Found 15 movie 
➸ Rambo - 2008
➸ Rambo: Last Blood - 2019 
➸ Rambo III - 1988
➸ Rambo: First Blood Part II - 1985 
➸ Rambo - 2020 
➸ Arthur Rambo 
➸ Rambo Zambo - 1984 
➸ Arthur Rambo 
➸ Rambo Tanggo Part III - 1984 
➸ Rambo: The Rescue 
➸ Rambo: To Hell and Back - 2010 
➸ Johny Tan-Go Rambo Part III 
➸ An American Hero's Journey: The Rambo Trilogy 
➸ Rambo and the Force of freedom - The Movie - 1986 
➸ Remo, Rambo, Reagan and Reds: The Eighties Action Movie Explosion - 2014 

Please select from the menu below.
```

Use the custom keyboard to select the Movie.

![Step One](https://raw.githubusercontent.com/nathan-owen/Radarr-Telegram-Bot/master/examples/step_1.jpg)

The bot will provide more info about the movie and ask you to confirm.

![Step Two](https://raw.githubusercontent.com/nathan-owen/Radarr-Telegram-Bot/master/examples/step_2.jpg)

The bot will ask you if you'd like to accept defaults or if you'd like to specify the settings.

![Step Three](https://raw.githubusercontent.com/nathan-owen/Radarr-Telegram-Bot/master/examples/step_3.jpg)

If you accepted defaults, it'll add the movie and you're done.

Otherwise,

The bot will ask you for the quality

```
Found 6 profiles
➸ Any
➸ SD
➸ HD-720p
➸ HD-1080p
➸ Ultra-HD
➸ HD - 720p/1080p

Please select from the menu below.
```

Send the profile using the custom keyboard

![Step Four](https://raw.githubusercontent.com/nathan-owen/Radarr-Telegram-Bot/master/examples/step_4.jpg)

The bot will ask you where the path you want the movie to go

```
Found 1 folders
➸ /media/

Please select from the menu below.
```

Send the folder using the custom keyboard

![Step Five](https://raw.githubusercontent.com/nathan-owen/Radarr-Telegram-Bot/master/examples/step_5.jpg)


If everything goes well, you'll see a text from the bot saying the movie was added.

### Additional commands
* `/upcoming` shows upcoming episodes, has a day parameter, defaults to 3 days
* `/library` search Sonarr library for existing shows
* `/help` show available commands
* `/clear` clear all previous commands and cache

### Admin commands
* `/wanted` search all missing/wanted episodes
* `/rss` perform an RSS Sync
* `/refresh` refreshes all series
* `/users` list users
* `/revoke` revoke user from bot
* `/unrevoke` un-revoke user from bot
* `/cid` gets current chat id

## Docker
Alternatively you may use Docker to start the bot
```
docker run --name radarr-telegram-bot \
  -e TELEGRAM_BOTTOKEN=
  -e BOT_PASSWORD=
  -e BOT_OWNER=
  -e BOT_NOTIFYID=
  -e BOT_MAXRESULTS=
  -e RADARR_HOST=
  -e RADARR_APIKEY=
  -e RADARR_PORT=
  -e RADARR_URLBASE=
  -e RADARR_SSL=
  -e RADARR_USERNAME=
  -e RADARR_PASSWORD=
  -e DEFAULTS_ROOT_FOLDER=
  -e DEFAULTS_PROFILE_ID=
  -e DEFAULTS_MONITOR=
  radarr-telegram-bot
```
<!-- 
**Prebuilt** Docker image for this bot can be found [here](https://hub.docker.com/repository/docker/nathanowen95/radarr-telegram-bot) -->

## License
(The MIT License)

Copyright (c) 2020 Nathan Owen <nathan.owen@live.com>

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
"Software"), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

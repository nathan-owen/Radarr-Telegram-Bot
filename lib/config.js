var fs = require('fs-extra');
var logger = require(__dirname + '/../lib/logger');

var configFile = __dirname + '/../config.json';
var dockerConfigFile = '/config/config.json';

var config;

if (process.env.TELEGRAM_BOTTOKEN) {
  if(locateConfigFile(dockerConfigFile) !== true) {
    setDefaultConfig();
  }
} else {
  if (locateConfigFile(configFile) !== true) {
    setDefaultConfig();
  }
}

function setDefaultConfig() {
  config          = {};
  config.telegram = {};
  config.bot      = {};
  config.radarr   = {};
  config.defaults = {};

}

function locateConfigFile(configFileName, result) {
  try {
    config = JSON.parse(fs.readFileSync(configFileName, 'utf8'));
    return true;
  } catch (err) {
        // JSON file is not correct
    if (err.name === 'SyntaxError') {
      throw new Error('Invalid configuration file, please make sure the file is in JSON format.');
    }

    // config file not found
    if (err.code === 'ENOENT') {
      logger.info('config file not found');
      return false;
    } 
  }
}

  // try {
  //   logger.info('config file found %s', configFile);
  //   config = JSON.parse(fs.readFileSync(configFile, 'utf8'));
  // } catch (err) {

  //   // JSON file is not correct
  //   if (err.name === 'SyntaxError') {
  //     throw new Error('Invalid configuration file, please make sure the file is in JSON format.');
  //   }

  //   // config file not found
  //   if (err.code === 'ENOENT') {
  //     logger.info('config file not found');
  //     config          = {};
  //     config.telegram = {};
  //     config.bot      = {};
  //     config.radarr   = {};
  //     config.defaults = {};
  //   }
  // }


/*
 * set up config options, they can be passed in thru the enviroment
 */
config.telegram.botToken = config.telegram.botToken || process.env.TELEGRAM_BOTTOKEN;

config.bot.password      = config.bot.password || process.env.BOT_PASSWORD || '';
config.bot.owner         = config.bot.owner || process.env.BOT_OWNER || 0;
config.bot.notifyId      = config.bot.notifyId || process.env.BOT_NOTIFYID || 0;
config.bot.maxResults    = config.bot.maxResults || process.env.BOT_MAXRESULTS || 15;
config.bot.lang          = config.bot.lang || 'en';

config.radarr.hostname   = config.radarr.hostname || process.env.RADARR_HOST || 'localhost';
config.radarr.apiKey     = config.radarr.apiKey || process.env.RADARR_APIKEY;
config.radarr.port       = config.radarr.port || process.env.RADARR_PORT || 7878;
config.radarr.urlBase    = config.radarr.urlBase || process.env.RADARR_URLBASE;
config.radarr.ssl        = config.radarr.ssl || process.env.RADARR_SSL || false;
config.radarr.username   = config.radarr.username || process.env.RADARR_USERNAME;
config.radarr.password   = config.radarr.password || process.env.RADARR_PASSWORD;
config.defaults.rootFolder = config.defaults.rootFolder || process.env.DEFAULTS_ROOT_FOLDER;
config.defaults.profileId  = config.defaults.profileId || process.env.DEFAULTS_PROFILE_ID;
config.defaults.monitor    = config.defaults.monitor || process.env.DEFAULTS_MONITOR;

module.exports = config;

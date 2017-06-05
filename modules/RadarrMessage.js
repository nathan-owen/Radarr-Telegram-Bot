/* global __dirname */

'use strict';

var RadarrAPI = require('sonarr-api');
var _         = require('lodash');
var moment    = require('moment');

var i18n   = require(__dirname + '/../lib/lang');
var config = require(__dirname + '/../lib/config');
var state  = require(__dirname + '/../lib/state');
var logger = require(__dirname + '/../lib/logger');
var acl    = require(__dirname + '/../lib/acl');

/*
 * initalize the class
 */
function RadarrMessage(bot, user, cache) {
  this.bot      = bot;
  this.user     = user;
  this.cache    = cache;
  this.adminId  = config.bot.owner;
  this.username = this.user.username || (this.user.first_name + (' ' + this.user.last_name || ''));

  this.radarr = new RadarrAPI({
    hostname : config.radarr.hostname,
    apiKey   : config.radarr.apiKey,
    port     : config.radarr.port,
    urlBase  : config.radarr.urlBase,
    ssl      : config.radarr.ssl,
    username : config.radarr.username,
    password : config.radarr.password
  });
}

/*
 * perform commands
 */
RadarrMessage.prototype.performLibrarySearch = function(searchText) {
  var self = this;

  var query = searchText;

  self.radarr.get('movie').then(function(result) {
    logger.info(i18n.__('logRadarrAllMovies',self.username));

    _.sortBy(result, 'title');

    var response = [];
    _.forEach(result, function(n, key) {
      var movie = '[' + n.title + '](http://themoviedb.org/movie/' + n.tmdbId + ')' + (n.year ? ' - _' + n.year + '_' : '');
      if (query) {
        if (n.title.search( new RegExp(query, 'i') ) !== -1) {
          response.push(movie);
        }
      } else {
        response.push(movie);
      }
    });

    if (!response.length) {
      throw new Error(i18n.__('errorRadarrUnableToLocate', query));
    }

    response.sort();

    if (query) {
      // add title to begining of the array
      response.unshift(i18n.__('botChatSonnarMatchingResults'));
    }

    if (response.length > 50) {
      var splitReponse = _.chunk(response, 50);
      splitReponse.sort();
      var i = 0;
      var libraryLoop = setInterval(function () {
        var n = splitReponse[i];
        if (n === undefined) {
          clearInterval(libraryLoop);
        } else {
          n.sort();
          self._sendMessage(n.join('\n'), []);
        }
        i = i + 1;
      }, 200);
    } else {
      return self._sendMessage(response.join('\n'), []);
    }

  }).catch(function(error) {
    return self._sendMessage(error);
  });

};


RadarrMessage.prototype.performRssSync = function() {
  var self = this;

  logger.info(i18n.__('logRadarrRSSCommandSent'));

  self.radarr.post('command', { 'name': 'RssSync' })
  .then(function() {
    logger.info('logRadarrRSSCommandExecuted', self.username);
    return self._sendMessage(i18n.__('botChatSonnarRSSCommandExecuted'));
  })
  .catch(function(error) {
    return self._sendMessage(error);
  });
};

/* Wanted Search Not Implemented Yet. There is an issue with the Radarr API
RadarrMessage.prototype.performWantedSearch = function() {
  var self = this;

  logger.info(i18n.__('logRadarrWantedCommandSent', self.username));

  self.radarr.get('/wanted/missing', {
    'page': 1,
    'pageSize': 50,
    'sortKey': 'airDateUtc',
    'sortDir': 'desc'
  })
  .then(function(wantedEpisodes) {
    var episodeIds = [];
    _.forEach(wantedEpisodes.records, function(n, key) {
      episodeIds.push(n.id);
    });
    return episodeIds;
  })
  .then(function(episodes) {
    self.radarr.post('command', {
      'name': 'EpisodeSearch',
      'episodeIds': episodes
    })
    .then(function() {
      logger.info(i18n.__('logRadarrWantedCommandExecuted', self.username));
      return self._sendMessage(i18n.__('botChatRadarrWantedCommandExecuted'));
    })
    .catch(function(error) {
      return self._sendMessage(error);
    });
  })
  .catch(function(error) {
    return self._sendMessage(error);
  });
};
*/

RadarrMessage.prototype.performLibraryRefresh = function() {
  var self = this;

  logger.info(i18n.__('logRadarrRefreshCommandSent', self.username));

  self.radarr.post('command', {
    'name': 'RefreshMovie'
  })
  .then(function() {
    logger.info(i18n.__('logRadarrRefreshCommandExecuted', self.username));
    return self._sendMessage(i18n.__('botChatRadarrRefreshCommandExecuted'));
  })
  .catch(function(error) {
    return self._sendMessage(error);
  });
};

RadarrMessage.prototype.performCalendarSearch = function(futureDays) {
  var self = this;

  var fromDate = moment().toISOString();
  var toDate = moment().add(futureDays, 'day').toISOString();

  logger.info(i18n.__('logRadarrUpcomingCommandSent', self.username, fromDate, toDate));

  self.radarr.get('calendar', { 'start': fromDate, 'end': toDate})
  .then(function (movie) {
    if (!movie.length) {
      throw new Error(i18n.__('errorRadarrNothingInCalendar'));
    }

    var lastDate = null;
    var response = [];
    _.forEach(movie, function(n, key) {
      var done = (n.hasFile ? i18n.__('RadarrDone') : '');

      // Add an empty line to break list of multiple days
      if(lastDate != null && n.airDate != lastDate) response.push(' ');

      response.push(n.physicalRelease + ' - ' + n.title + done);
      lastDate = n.airDate;
    });

    logger.info(i18n.__("logRadarrFoundMovie", self.username, response.join(',')));

    return self._sendMessage(response.join('\n'), []);
  })
  .catch(function(error) {
    return self._sendMessage(error);
  });
};


/*
 * handle the flow of adding a new series
 */
RadarrMessage.prototype.sendSeriesList = function(seriesName) {
  var self = this;

  self.test = 'hello';

  logger.info(i18n.__('logRadarrQueryCommandSent', self.username));

  self.radarr.get('series/lookup', { 'term': seriesName }).then(function(result) {
    if (!result.length) {
      throw new Error(i18n.__('errorRadarrSerieNotFound', seriesName));
    }

    var series = result;

    logger.info(i18n.__('logRadarrUserSerieRequested', self.username, seriesName));

    var seriesList = [], keyboardList = [];

    series.length = (series.length > config.bot.maxResults ? config.bot.maxResults : series.length);

    var response = [i18n.__('botChatRadarrFoundNSeries', series.length)];

    _.forEach(series, function(n, key) {

      var imageCover = null;
      _.forEach(n.images, function(image, index){
        if(image.coverType === 'poster'){
          imageCover = image.url;
        }
      });

      var id = key + 1;
      var keyboardValue = n.title + (n.year ? ' - ' + n.year : '');

      seriesList.push({
        'id': id,
        'title': n.title,
        'plot': n.overview,
        'year': n.year,
        'tvdbId': n.tvdbId,
        'titleSlug': n.titleSlug,
        'seasons': n.seasons,
        'keyboardValue': keyboardValue,
        'coverUrl': imageCover
      });

      keyboardList.push([keyboardValue]);

      response.push('➸ ['+keyboardValue+'](http://thetvdb.com/?tab=series&id='+n.tvdbId+')');
    });

    response.push(i18n.__('selectFromMenu'));

    logger.info(i18n.__("logRadarrFoundSeries2", self.username, keyboardList.join(',')));

    // set cache
    self.cache.set('seriesList' + self.user.id, seriesList);
    self.cache.set('state' + self.user.id, state.radarr.CONFIRM);

    return self._sendMessage(response.join('\n'), keyboardList);
  })
  .catch(function(error) {
    return self._sendMessage(error);
  });
};

RadarrMessage.prototype.confirmShowSelect = function(displayName) {
  var self = this;

  var seriesList = self.cache.get('seriesList' + self.user.id);

  if (!seriesList) {
    return self._sendMessage(new Error(i18n.__('errorRadarrWentWrong')));
  }

  var series = _.filter(seriesList, function(item) { return item.keyboardValue === displayName; })[0];
  if (!series) {
    return self._sendMessage(new Error(i18n.__('botChatRadarrSerieNotFound', displayName)));
  }

  // use workflow to run async tasks
  var workflow = new (require('events').EventEmitter)();

  // check for existing series on radarr
  workflow.on('checkRadarrSeries', function () {
    self.radarr.get('series').then(function(result) {
      logger.info(i18n.__('logRadarrLookingForExistingSeries', self.username));

      var existingSeries = _.filter(result, function(item) { return item.tvdbId === series.tvdbId; })[0];
      if (existingSeries) {
        throw new Error(i18n.__('errorRadarrSerieAlreadyTracked'));
      }
      workflow.emit('confirmShow');
    }).catch(function(error) {
      return self._sendMessage(error);
    });
  });

  // check for existing series on radarr
  workflow.on('confirmShow', function () {
    self.radarr.get('series').then(function(result) {
      logger.info(i18n.__('logRadarrConfirmCorrectShow', series.keyboardValue, self.username));

      var keyboardList = [[i18n.__('globalYes')], [i18n.__('globalNo')]];

      var response = ['*' + series.title + ' (' + series.year + ')*\n'];

      response.push(series.plot + '\n');
      response.push(i18n.__('botChatRadarrIsShowCorrect'));
      response.push(i18n.__('globalArrowYes'));
      response.push(i18n.__('globalArrowNo'));

      // Add cover to message (if available)
      if(series.coverUrl !== null){
        response.push('\n[Poster!](' + series.coverUrl + ')');
      }

      // set cache
      self.cache.set('state' + self.user.id, state.radarr.PROFILE);
      self.cache.set('seriesId' + self.user.id, series.id);

      return self._sendMessage(response.join('\n'), keyboardList);

    }).catch(function(error) {
      return self._sendMessage(error);
    });
  });

  /**
   * Initiate the workflow
   */
  workflow.emit('checkRadarrSeries');
};

RadarrMessage.prototype.sendProfileList = function(displayName) {
  var self = this;

  var seriesId = self.cache.get('seriesId' + self.user.id);

  if (!seriesId) {
    return self._sendMessage(new Error(i18n.__('errorRadarrWentWrong')));
  }

  if(displayName == 'No'){
    return self._sendMessage(new Error(i18n.__('globalAborted')));
  }

  // use workflow to run async tasks
  var workflow = new (require('events').EventEmitter)();

  // get the radarr profiles
  workflow.on('getRadarrProfiles', function () {
    self.radarr.get('profile').then(function(result) {
      if (!result.length) {
        throw new Error(i18n.__('errorRadarrCouldntGetProfile'));
      }

      var profiles = result;

      logger.info(i18n.__('logRadarrProfileListRequested', self.username));

      var profileList = [], keyboardList = [], keyboardRow = [];
      var response = ['*Found ' + profiles.length + ' profiles*'];
      _.forEach(profiles, function(n, key) {

        profileList.push({ 'name': n.name, 'profileId': n.id });
        response.push('➸ ' + n.name);

        // Profile names are short, put two on each custom
        // keyboard row to reduce scrolling
        keyboardRow.push(n.name);
        if (keyboardRow.length === 2) {
          keyboardList.push(keyboardRow);
          keyboardRow = [];
        }
      });

      if (keyboardRow.length === 1) {
        keyboardList.push([keyboardRow[0]]);
      }

      response.push(i18n.__('selectFromMenu'));

      logger.info(i18n.__('logRadarrFoundProfile', self.username, keyboardList.join(',')));

      // set cache
      self.cache.set('state' + self.user.id, state.radarr.MONITOR);
      self.cache.set('seriesProfileList' + self.user.id, profileList);

      return self._sendMessage(response.join('\n'), keyboardList);
    })
    .catch(function(error) {
      return self._sendMessage(error);
    });
  });

  /**
   * Initiate the workflow
   */
  workflow.emit('getRadarrProfiles');
};

RadarrMessage.prototype.sendMonitorList = function(profileName) {
  var self = this;

  var profileList = self.cache.get('seriesProfileList' + self.user.id);
  if (!profileList) {
    return self._sendMessage(new Error(i18n.__('errorRadarrWentWrong')));
  }

  var profile = _.filter(profileList, function(item) { return item.name === profileName; })[0];
  if (!profile) {
    return self._sendMessage(new Error(i18n.__('errorRadarrWentWrong')));
  }

  logger.info(i18n.__('logRadarrMonitorListRequest', self.username));

  var monitor = ['future', 'all', 'none', 'latest', 'first'];
  var monitorList = [], keyboardList = [], keyboardRow = [];
  var response = [i18n.__('botChatRadarrSelectSeason')];
  _.forEach(monitor, function(n, key) {
    monitorList.push({ 'type': n });

    response.push('➸ ' + n);

    keyboardRow.push(n);
    if (keyboardRow.length === 2) {
      keyboardList.push(keyboardRow);
      keyboardRow = [];
    }
  });

  if (keyboardRow.length === 1) {
    keyboardList.push([keyboardRow[0]]);
  }

  response.push(i18n.__('selectFromMenu'));

  logger.info(i18n.__('logRadarrFoundMonitorType', self.username, keyboardList.join(',')));

  self.cache.set('seriesProfileId' + self.user.id, profile.profileId);
  self.cache.set('seriesMonitorList' + self.user.id, monitorList);
  self.cache.set('state' + self.user.id, state.radarr.TYPE);

  return self._sendMessage(response.join('\n'), keyboardList);
};

RadarrMessage.prototype.sendTypeList = function(monitorName) {
  var self = this;

  var monitorList = self.cache.get('seriesMonitorList' + self.user.id);
  if (!monitorList) {
    return self._sendMessage(new Error(i18n.__('errorRadarrWentWrong')));
  }

  var monitor = _.filter(monitorList, function(item) { return item.type === monitorName; })[0];
  if (!monitor) {
    return self._sendMessage(new Error(i18n.__('errorRadarrWentWrong')));
  }

  logger.info(i18n.__('logRadarrUserSeriesTypeRequested', self.username));

  var type = ['standard', 'airs daily', 'anime'];
  var typeList = [], keyboardList = [], keyboardRow = [];
  var response = [i18n.__('selectSeriesType')];
  _.forEach(type, function(n, key) {
    typeList.push({ 'type': n });

    response.push('➸ ' + n);

    keyboardRow.push(n);
    if (keyboardRow.length === 2) {
      keyboardList.push(keyboardRow);
      keyboardRow = [];
    }
  });

  if (keyboardRow.length === 1) {
    keyboardList.push([keyboardRow[0]]);
  }

  response.push(i18n.__('selectFromMenu'));

  logger.info(i18n.__('logRadarrFoundSeriesType', self.username, keyboardList.join(',')));

  self.cache.set('seriesMonitorId' + self.user.id, monitor.type);
  self.cache.set('seriesTypeList' + self.user.id, typeList);
  self.cache.set('state' + self.user.id, state.radarr.FOLDER);

  return self._sendMessage(response.join('\n'), keyboardList);
};

RadarrMessage.prototype.sendFolderList = function(typeName) {
  var self = this;

  var typeList = self.cache.get('seriesTypeList' + self.user.id);
  if (!typeList) {
    return self._sendMessage(new Error(i18n.__('errorRadarrWentWrong')));
  }

  var type = _.filter(typeList, function(item) { return item.type === typeName; })[0];
  if (!type) {
    return self._sendMessage(new Error(i18n.__('errorRadarrWentWrong')));
  }

  self.radarr.get('rootfolder').then(function(result) {
    if (!result.length) {
      throw new Error(i18n.__("errorRadarrCouldntFindFolders"));
    }

    var folders = result;

    logger.info(i18n.__('logRadarrFolderListRequested', self.username));

    var folderList = [], keyboardList = [];
    var response = ['*Found ' + folders.length + ' folders*'];
    _.forEach(folders, function(n, key) {
      folderList.push({ 'path': n.path, 'folderId': n.id });

      response.push('➸ ' + n.path);

      keyboardList.push([n.path]);
    });
    response.push(i18n.__('selectFromMenu'));

    logger.info(i18n.__('logRadarrFoundFolders', self.username, keyboardList.join(',')));

    // set cache
    self.cache.set('seriesTypeId' + self.user.id, type.type);
    self.cache.set('seriesFolderList' + self.user.id, folderList);
    self.cache.set('state' + self.user.id, state.radarr.SEASON_FOLDER);

    return self._sendMessage(response.join('\n'), keyboardList);
  })
  .catch(function(error) {
    return self._sendMessage(error);
  });
};

RadarrMessage.prototype.sendSeasonFolderList = function(folderName) {
  var self = this;

  var folderList = self.cache.get('seriesFolderList' + self.user.id);
  if (!folderList) {
    return self._sendMessage(new Error(i18n.__('errorRadarrWentWrong')));
  }

  var folder = _.filter(folderList, function(item) { return item.path === folderName; })[0];
  if (!folder) {
    return self._sendMessage(new Error(i18n.__('errorRadarrWentWrong')));
  }

  logger.info(i18n.__('logRadarrSeasonFoldersListRequested', self.username));

  var seasonFolder = [i18n.__('globalYes'), i18n.__('globalNo')];
  var seasonFolderList = [], keyboardList = [], keyboardRow = [];
  var response = [i18n.__('askUsingSeasonFolders')];
  _.forEach(seasonFolder, function(n, key) {
    seasonFolderList.push({ 'type': n });

    response.push('➸ ' + n);

    keyboardRow.push(n);
    if (keyboardRow.length === 2) {
      keyboardList.push(keyboardRow);
      keyboardRow = [];
    }
  });

  if (keyboardRow.length === 1) {
    keyboardList.push([keyboardRow[0]]);
  }

  response.push(i18n.__('selectFromMenu'));

    logger.info(i18n.__('logRadarrFoundSeasonsFolderTypes', self.username, keyboardList.join(',')));

  self.cache.set('seriesFolderId' + self.user.id, folder.folderId);
  self.cache.set('seriesSeasonFolderList' + self.user.id, seasonFolderList);
  self.cache.set('state' + self.user.id, state.radarr.ADD_SERIES);

  return self._sendMessage(response.join('\n'), keyboardList);
};

RadarrMessage.prototype.sendAddSeries = function(seasonFolderName) {
  var self = this;

  var seriesId         = self.cache.get('seriesId' + self.user.id);
  var seriesList       = self.cache.get('seriesList' + self.user.id);
  var profileId        = self.cache.get('seriesProfileId' + self.user.id);
  var profileList      = self.cache.get('seriesProfileList' + self.user.id);
  var monitorId        = self.cache.get('seriesMonitorId' + self.user.id);
  var monitorList      = self.cache.get('seriesMonitorList' + self.user.id);
  var typeId           = self.cache.get('seriesTypeId' + self.user.id);
  var typeList         = self.cache.get('seriesTypeList' + self.user.id);
  var folderId         = self.cache.get('seriesFolderId' + self.user.id);
  var folderList       = self.cache.get('seriesFolderList' + self.user.id);
  var seasonFolderId   = seasonFolderName;
  var seasonFolderList = self.cache.get('seriesSeasonFolderList' + self.user.id);

  if (!seasonFolderList) {
    self._sendMessage(new Error(i18n.__('errorRadarrWentWrong')));
  }

  var series       = _.filter(seriesList, function(item) { return item.id === seriesId; })[0];
  var profile      = _.filter(profileList, function(item) { return item.profileId === profileId; })[0];
  var monitor      = _.filter(monitorList, function(item) { return item.type === monitorId; })[0];
  var type         = _.filter(typeList, function(item) { return item.type === typeId; })[0];
  var folder       = _.filter(folderList, function(item) { return item.folderId === folderId; })[0];
  var seasonFolder = _.filter(seasonFolderList, function(item) { return item.type === seasonFolderId; })[0];

  var postOpts              = {};
  postOpts.tvdbId           = series.tvdbId;
  postOpts.title            = series.title;
  postOpts.titleSlug        = series.titleSlug;
  postOpts.rootFolderPath   = folder.path;
  postOpts.seasonFolder     = (seasonFolder.type === i18n.__("globalYes") ? true : false);
  postOpts.monitored        = true;
  postOpts.seriesType       = (type.type === 'airs daily' ? 'daily' : type.type);
  postOpts.qualityProfileId = profile.profileId;
  postOpts.images           = [];

  var lastSeason  = _.max(series.seasons, 'seasonNumber');
  var firstSeason = _.min(_.reject(series.seasons, { seasonNumber: 0 }), 'seasonNumber');

  switch (monitor.type) {
    case 'future':
      postOpts.ignoreEpisodesWithFiles = true;
      postOpts.ignoreEpisodesWithoutFiles = true;
      break;
    case 'all':
      postOpts.ignoreEpisodesWithFiles = false;
      postOpts.ignoreEpisodesWithoutFiles = false;

      _.each(series.seasons, function(season) {
        if (season.seasonNumber !== 0) {
          season.monitored = true;
        } else {
          season.monitored = false;
        }
      });
      break;
    case 'none':
      _.each(series.seasons, function(season) {
        season.monitored = false;
      });
      break;
    case 'latest':
      _.each(series.seasons, function(season) {
        if (season.seasonNumber === lastSeason.seasonNumber) {
          season.monitored = true;
        } else {
          season.monitored = false;
        }
      });
      break;
    case 'first':
      _.each(series.seasons, function(season) {
        if (season.seasonNumber === firstSeason.seasonNumber) {
          season.monitored = true;
        } else {
          season.monitored = false;
        }
      });
      break;
    default:
      self._sendMessage(new Error(i18n.__('errorRadarrWentWrong')));
  }

  // update seasons to be monitored
  postOpts.seasons = series.seasons;

  logger.info(i18n.__("logRadarrSerieAddedWithOptions", self.username, series.title, JSON.stringify(postOpts)));

  self.radarr.post('series', postOpts).then(function(result) {
    if (!result) {
      throw new Error(i18n.__("logRadarrSerieCantAdd"));
    }

    logger.info(i18n.__("logRadarrSerieAdded", self.username, series.title));

    if (self._isBotAdmin() && self.adminId !== self.user.id) {
      self.bot.sendMessage(self.user.id, i18n.__("botChatRadarrSerieAddedBy", series.title, self.username), {
        'selective': 2,
        'parse_mode': 'Markdown',
        'reply_markup': {
          'hide_keyboard': true
        }
      });
    }

    return self.bot.sendMessage(self.user.id, i18n.__("botChatRadarrSerieAdded", series.title), {
      'selective': 2,
      'parse_mode': 'Markdown',
      'reply_markup': {
        'hide_keyboard': true
      }
    });
  })
  .catch(function(error) {
    return self._sendMessage(error);
  })
  .finally(function() {
    self._clearCache();
  });

};

/*
 * private methods
 */
RadarrMessage.prototype._sendMessage = function(message, keyboard) {
  var self = this;
  keyboard = keyboard || null;

  var options;
  if (message instanceof Error) {
    logger.warn(i18n.__("logMessageClear", self.username, message.message));

    message = message.message;
    options = {
      'parse_mode': 'Markdown',
      'reply_markup': {
        'hide_keyboard': true
      }
    };
  } else {
    options = {
      'disable_web_page_preview': true,
      'parse_mode': 'Markdown',
      'selective': 2,
      'reply_markup': JSON.stringify( { keyboard: keyboard, one_time_keyboard: true })
    };
  }

  return self.bot.sendMessage(self.user.id, message, options);
};

RadarrMessage.prototype._isBotAdmin = function() {
  if (this.adminId === this.user.id) {
    return true;
  }
  return false;
};

RadarrMessage.prototype._clearCache = function() {
  var self = this;

  logger.info(i18n.__("logClearCache", self.username));

  var cacheItems = [
    'seriesId', 'seriesList', 'seriesProfileId',
    'seriesProfileList', 'seriesFolderId', 'seriesFolderList',
    'seriesMonitorId', 'seriesMonitorList', 'seriesFolderId',
    'seriesFolderList', 'seriesTypeId', 'seriesTypeList',
    'seriesSeasonFolderList', 'state'
  ];

  return _(cacheItems).forEach(function(item) {
    self.cache.del(item + self.user.id);
  });
};

module.exports = RadarrMessage;

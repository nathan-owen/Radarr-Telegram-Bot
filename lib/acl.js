/* global __dirname */

var i18n = require('i18n');
var fs = require('fs-extra');
var logger = require(__dirname + '/../lib/logger');

var aclListFile;
var aclListFileTemplate = __dirname + '/../acl.json.template';

if (process.env.TELEGRAM_BOTTOKEN) {
   aclListFile = '/config/acl.json';
} else {
  aclListFile = __dirname + '/../acl.json';
}

var acl;

try {
  logger.info(i18n.__("logAclFileFound",aclListFile));
  acl = JSON.parse(fs.readFileSync(aclListFile, 'utf8'));
} catch (err) {
  if (err.name === 'SyntaxError') {
    throw new Error(i18n.__("logAclInvalidSyntax"));
  }
  
  // config file not found
  if (err.code === 'ENOENT') {
    logger.warn(i18n.__("logAclInvalidFile"));
    logger.info("ACL File Not Found. Creating Now: ", aclListFile);
    fs.copySync(aclListFileTemplate, aclListFile);
    acl = JSON.parse(fs.readFileSync(aclListFile, 'utf8'));
  }
}

module.exports = acl;

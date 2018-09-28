//helpers for various tasks including password 
//dependencies
var crypto = require('crypto');
var config = require('./config');
var https = require('https');
var querystring = require('querystring');
var util = require("util");

//container for the helpers 
var helpers = {};

//create a SHA256 has
helpers.hashing = function(str) {
    if (typeof(str) == 'string' && str.length > 0) {
        var hash = crypto.createHmac('sha256', config.hashingSecret).update(str).digest('hex');
        return hash;
    } else {
        return false;
    }
};

helpers.parseJsonToObject = function(str) {

    try {
        var obj = JSON.parse(str);
        return obj;

    } catch (e) {
        return {};
    }
};

//create a random character string
helpers.createRandomString = function(strLength) {
    strLength = typeof(strLength) == 'number' && strLength > 0 ? strLength : false;
    if (strLength) {
        var possibleCharacters = 'abcdefghijklmnopqrstuvwxyz0123456789';
        //start the final string
        var str = '';
        for (i = 1; i <= strLength; i++) {
            //get a random character from the set
            var randomCharacter = possibleCharacters.charAt(Math.floor(Math.random() * possibleCharacters.length));
            //append this character to the final string
            str += randomCharacter;
        }
        //return the final string
        return str;
    } else {
        return false;
    }
};

module.exports = helpers;
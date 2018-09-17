/*
 * Helper functions
 *
 */

// Dependencies
const crypto = require('crypto');
const config = require('./config')
const querystring = require('querystring');

const helpers = {};

// SHA256 hash function
helpers.hash = async (targetString) => {
  if (typeof(targetString) == 'string' && targetString.length > 0) {
    const hash = crypto.createHmac('sha256', config.environment.hashSecret).update(targetString).digest('hex');
    return hash;
  } else {
    return false;
  }
};

helpers.createRandomString = async (strLength) => {
  // Validate String length param
  strLength = typeof(strLength) == 'number' && strLength > 0 ? strLength : false;

  if (strLength) {
    // Define all possible characters
    const possibleChars = 'abcdefghijklmnopqrstuvwxyz1234567890';

    let str = '';

    // randomly add each character to the final string
    for (let i = 0; i < strLength; i++) {
      str += possibleChars.charAt(Math.floor(Math.random() * possibleChars.length));
    }

    return str;
  } else {
    return false;
  }
}

// Parse JSONObject from a string
helpers.parseJSONObject = (string) => {
  try {
    return JSON.parse(string);
  } catch (ex) {
    return {};
  }
};

// Validate email address
helpers.validateEmail = (emailString) => {
  const re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  return re.test(emailString);
};

helpers.convertCentToDollar = (cent) => {
  return cent / 100;
};
 // Export module
 module.exports = helpers;
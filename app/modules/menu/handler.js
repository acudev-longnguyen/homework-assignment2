/*
 * User handlers
 *
 */

// Dependencies
const helpers = require('../../lib/helpers');
const _data = require('../../lib/data');
const verifyToken = require('../token/handler').verifyToken;
const Response = require('../../model/responseModel');

const menuHandlers = {};

menuHandlers.menu = async (data) => {
  const acceptableMethods = ['post', 'get', 'put', 'delete'];
  if (acceptableMethods.indexOf(data.method) > -1) {
    return await menuHandlers._menu[data.method](data);
  } else {
    return new Response(405, {'Error' : 'Method not allowed'})
  }
};

menuHandlers._menu = {};

/* 
 * Required fields: token, email
 * Optional fields: None
 */ 
menuHandlers._menu.get = async (data) => {
  const email = typeof(data.queryStringObject.email) == 'string' && data.queryStringObject.email.trim().length > 0 && helpers.validateEmail(data.queryStringObject.email)
                  ? data.queryStringObject.email.trim()
                  : false;
  // get token from request header
  const token = typeof(data.headers.token == 'string') ? data.headers.token : false;

  // validate token
  const isValidToken = await verifyToken(token, email);

  if (!isValidToken) {
    return new Response(400, {'Error' : 'Missing required token'});
  }

  // Read menu from stored menu file
  const menu = await _data.read('menu', 'menu');

  return new Response(200, menu);
};

// Export module
module.exports = menuHandlers;
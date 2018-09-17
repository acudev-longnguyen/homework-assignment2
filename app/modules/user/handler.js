/*
 * User handlers
 *
 */

// Dependencies
const helpers = require('../../lib/helpers');
const _data = require('../../lib/data');
const verifyToken = require('../token/handler').verifyToken;
const Response = require('../../model/responseModel');

const userHandlers = {};

userHandlers.users = async (data) => {
  const acceptableMethods = ['post', 'get', 'put', 'delete'];
  if (acceptableMethods.indexOf(data.method) > -1) {
    return await userHandlers._users[data.method](data);
  } else {
    return new Response(405, {'Error' : 'Method not allowed'})
  }
};

userHandlers._users = {};

/* 
 * Required fields: email, firstName, lastName, password, address
 * Optional fields: None
 */ 
userHandlers._users.post = async (data) => {
  const email = typeof(data.payload.email) == 'string' && data.payload.email.trim().length > 0 && helpers.validateEmail(data.payload.email)
                  ? data.payload.email.trim()
                  : false;
  const firstName = typeof(data.payload.firstName) == 'string' && data.payload.firstName.trim().length > 0
                  ? data.payload.firstName.trim()
                  : false;
  const lastName = typeof(data.payload.lastName) == 'string' && data.payload.lastName.trim().length > 0
                  ? data.payload.lastName.trim()
                  : false;
  const password = typeof(data.payload.password) == 'string' && data.payload.password.trim().length > 0
                  ? data.payload.password.trim()
                  : false;
  const address = typeof(data.payload.address) == 'string' && data.payload.address.trim().length > 0 && data.payload.address.trim().length <500
                  ? data.payload.address.trim()
                  : false;
  if (!email || !firstName || !lastName ||!password || !address) {
    return new Response(400, {'Error' : 'Missing required fields'});
  }

  // Attempt to read for user from datasource
  const userData = await _data.read('users', email);

  // If user data is return, a user is already exist with this email
  if (userData) {
    return new Response(400, {'Error' : 'This email address is already in use.'});
  }

      // hash the input passwordreturn new Response(400, {'Error' : 'Missing required fields'});
  const hashedPassword = await helpers.hash(password);

  if (!hashedPassword) {
    return new Response(400, {'Error' : 'Cannot hash new user\'s password.'});
  }

  let userObject = {
    firstName,
    lastName,
    email,
    hashedPassword,
    address
  };

  // Write new user object to data source
  await _data.create('users', email, userObject);

  return new Response(200, {'Result' : 'success'});
};

/* 
 * Required fields: token, email
 * Optional fields: firstName, lastName, password, address
 */ 
userHandlers._users.put = async (data, callback) => {
  const email = typeof(data.payload.email) == 'string' && data.payload.email.trim().length > 0 && helpers.validateEmail(data.payload.email)
                  ? data.payload.email.trim()
                  : false;
  const firstName = typeof(data.payload.firstName) == 'string' && data.payload.firstName.trim().length > 0
                  ? data.payload.firstName.trim()
                  : false;
  const lastName = typeof(data.payload.lastName) == 'string' && data.payload.lastName.trim().length > 0
                  ? data.payload.lastName.trim()
                  : false;
  const password = typeof(data.payload.password) == 'string' && data.payload.password.trim().length > 0
                  ? data.payload.password.trim()
                  : false;
  const address = typeof(data.payload.address) == 'string' && data.payload.address.trim().length > 0 && data.payload.address.trim().length <500
                  ? data.payload.address.trim()
                  : false;
  // get token from request header
  const token = typeof(data.headers.token == 'string') ? data.headers.token : false;

  const isValidToken = await verifyToken(token, email);

  if (!isValidToken) {
    return new Response(400, {'Error' : 'Missing required token'});
  }

  if (!email) {
    return new Response(400, {'Error' : 'Missing required fields'});
  }

  // Attempt to read for user from datasource
  const userData = await _data.read('users', email);

  if (!userData) {
    return new Response(400, {'Error' : 'Cannot find user with this email address'});
  }

  // Update user object with param if they are valid
  userData.firstName = firstName ? firstName : userData.firstName;
  userData.lastName = lastName ? lastName : userData.lastName;
  userData.address = address ? address : userData.address;
  if (password) {
    userData.hashedPassword = await helpers.hash(password);  
  }

  await _data.update('users', email, userData);

  return new Response(200, {'Result' : 'success'});
};

/* 
 * Required fields: token, email
 * Optional fields: None
 */
userHandlers._users.get = async (data, callback) => {
  const email = typeof(data.queryStringObject.email) == 'string' && data.queryStringObject.email.trim().length > 0 && helpers.validateEmail(data.queryStringObject.email)
                  ? data.queryStringObject.email.trim()
                  : false;

  // get token from request header
  const token = typeof(data.headers.token == 'string') ? data.headers.token : false;
  // verify token and email combination to make sure only authorized user can get their token data
  const isValidToken = await verifyToken(token, email);

  if (!isValidToken) {
    return new Response(400, {'Error' : 'Missing required token'});
  }

  const tokenData = await _data.read('tokens', token);

  if (!tokenData) {
    return new Response(400, {'Error' : 'Cannot retrieve token object'});
  }

  if (!email || email != tokenData.email) {
    return new Response(400, {'Error' : 'Email and token don\'t match'});
  }

  // Attempt to read for user from datasource
  const userData = await _data.read('users', email);

  if (!userData) {
    return new Response(400, {'Error' : 'Cannot get user'});
  }

  // remove password before returning
  delete userData.hashedPassword;
  return new Response(200, userData);
};

/* 
 * Required fields: token, email
 * Optional fields: None
 */
userHandlers._users.delete = async (data, callback) => {
  const email = typeof(data.queryStringObject.email) == 'string' && data.queryStringObject.email.trim().length > 0 && helpers.validateEmail(data.queryStringObject.email)
                  ? data.queryStringObject.email.trim()
                  : false;
  // get token from request header
  const token = typeof(data.headers.token == 'string') ? data.headers.token : false;
  
  // verify token and email combination to make sure only authorized user can get their token data
  const isValidToken = await verifyToken(token, email);

  if (!isValidToken) {
    return new Response(400, {'Error' : 'Missing required token'});
  }

  if (!email) {
    return new Response(400, {'Error' : 'Missing required fields'});
  }

  // Attempt to read for user from datasource
  const userData = await _data.read('users', email);

  if (!userData) {
    return new Response(400, {'Error' : 'Cannot get user'});
  }

  // user found, perform delete
  await _data.delete('users', email);

  return new Response(200, {'Result' : 'Success'});
};

// Export module
module.exports = userHandlers;
/*
 * User handlers
 *
 */

// Dependencies
const helpers = require('../../lib/helpers');
const _data = require('../../lib/data');
const Response = require('../../model/responseModel');

const tokenHandlers = {};

tokenHandlers.tokens = async (data) => {
  const acceptableMethods = ['post', 'get', 'put', 'delete'];
  if (acceptableMethods.indexOf(data.method) > -1) {
    return await tokenHandlers._tokens[data.method](data);
  } else {
    return new Response(405, {'Error' : 'Method not allowed'})
  }
};

tokenHandlers._tokens = {};

/* 
 * Required fields: email, password
 * Optional fields: None
 */ 
tokenHandlers._tokens.post = async (data) => {
  const email = typeof(data.payload.email) == 'string' && data.payload.email.trim().length > 0 && helpers.validateEmail(data.payload.email)
                  ? data.payload.email.trim()
                  : false;
  const password = typeof(data.payload.password) == 'string' && data.payload.password.trim().length > 0
                  ? data.payload.password.trim()
                  : false;

  if (email && password) {
    // retrieve user with email
    const userData = await _data.read('users', email);

    if (!userData) {
      return new Response(400, {'Error' : 'Cannot find user'});
    }

    // hash the input password
    const hashedPassword = await helpers.hash(password);

    // Compare the hashed input password to the user hashed password
    if (hashedPassword != userData.hashedPassword) {
      return new Response(400, {'Error' : 'Invalid password'});
    }

    const tokenId = await helpers.createRandomString(20);
    const expires = Date.now() + (1000 * 60 * 60);

    // form the token Object for storage
    let tokenObject = {
      email,
      tokenId,
      expires
    };

    // Store the token
    await _data.create('tokens', tokenId, tokenObject);

    return new Response(200, tokenObject);
  } else {
    return new Response(400, {'Error' : 'Missing required fields'});
  }
};

/* 
 * Required fields: tokenId
 * Optional fields: None
 */ 
tokenHandlers._tokens.get = async (data) => {
  const tokenId = typeof(data.queryStringObject.tokenId) == 'string' && data.queryStringObject.tokenId.trim().length == 20 
                ? data.queryStringObject.tokenId.trim() 
                : false;

  // Read token by the input tokenId
  const token = await _data.read('tokens', tokenId);

  // If read fail or the returned token is expired
  if (!token || token.expires < Date.now()) {
    return new Response(400, {'Error' : 'Token not found or might have expired'})
  }

  return new Response(200, token);
};

/* 
 * Required fields: tokenId, extend
 * Optional fields: None
 */
tokenHandlers._tokens.put = async (data) => {
  const tokenId = typeof(data.payload.tokenId) == 'string' && data.payload.tokenId.trim().length == 20 
                ? data.payload.tokenId.trim() 
                : false;
  const extend = typeof(data.payload.extend) == 'boolean' && data.payload.extend == true
                  ? true
                  : false;

  // Read token by the input tokenId
  const token = await _data.read('tokens', tokenId);

  if (!token) {
    return new Response(400, {'Error' : 'Token not found'})
  }

  // If token is still valid and extend flag is true
  if (token.expires > Date.now() && extend) {
    // Set expiration to the next 1 hour 
    token.expires = Date.now() + (1000 * 60 * 60);
  } else {
    return new Response(400, {'Error' : 'Token is expired'})
  }

  // update 
  await _data.update('tokens', tokenId, token);

  return new Response(200);
};

/* 
 * Required fields: tokenId
 * Optional fields: None
 */
tokenHandlers._tokens.delete = async (data) => {
  const tokenId = typeof(data.queryStringObject.tokenId) == 'string' && data.queryStringObject.tokenId.trim().length == 20 
                ? data.queryStringObject.tokenId.trim() 
                : false;
  
  // Read token by the input tokenId
  const token = await _data.read('tokens', tokenId);

  if (!token) {
    return new Response(400, {'Error' : 'Token not found'})
  }

  // If token is found, perform delete
  const deleteResult = await _data.delete('tokens', tokenId);

  if (!deleteResult) {
    return new Response(400, {'Error' : 'Cannot delete this token'})
  }

  return new Response(200, {'Result' : 'Token deleted'})
};

/* 
 * Required fields: tokenId, email
 * Optional fields: None
 */
tokenHandlers.verifyToken = async (tokenId, email) => {
  const tokenData = await _data.read('tokens', tokenId);
  
  if (tokenData && tokenData.email == email && tokenData.expires > Date.now()) {
    return true;
  } else {
    return false;
  }
};

// Export module
module.exports = tokenHandlers;
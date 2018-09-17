/*
 * User handlers
 *
 */

// Dependencies
const helpers = require('../../lib/helpers');
const _data = require('../../lib/data');
const verifyToken = require('../token/handler').verifyToken;
const Response = require('../../model/responseModel');

const cartHandlers = {};

cartHandlers.shoppingCart = async (data) => {
  var acceptableMethods = ['post', 'get', 'put', 'delete'];
  if (acceptableMethods.indexOf(data.method) > -1) {
    return await cartHandlers._cart[data.method](data);
  } else {
    return new Response(405, {'Error' : 'Method not allowed'})
  }
};

cartHandlers._cart = {};

/* 
 * Required fields: token, email
 * Optional fields: None
 */ 
cartHandlers._cart.post = async (data, callback) => {
  const email = typeof(data.payload.email) == 'string' && data.payload.email.trim().length > 0 && helpers.validateEmail(data.payload.email)
                  ? data.payload.email.trim()
                  : false;
  // get token from request header
  const token = typeof(data.headers.token == 'string') ? data.headers.token : false;

  // validate token
  const isValidToken = await verifyToken(token, email);

  if (!isValidToken) {
    return new Response(400, {'Error' : 'Missing required token'});
  }

  const cart = await _data.read('shoppingcart', token);

  if (cart) {
    return new Response(400, {'Error' : 'Shopping cart exists'});
  }

  await _data.create('shoppingcart', token, []);

  return new Response(200);
};

/* 
 * Required fields: token, email
 * Optional fields: None
 */ 
cartHandlers._cart.get = async (data, callback) => {
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

  const cartData = await _data.read('shoppingcart', token);

  if (!cartData) {
    return new Response(400, {'Error' : `No shopping cart found for token ${token}`});
  }

  return new Response(200, cartData);
};

/* 
 * Required fields: token, email, cartData
 * Optional fields: None
 */
cartHandlers._cart.put = async (data, callback) => {
  const email = typeof(data.payload.email) == 'string' && data.payload.email.trim().length > 0 && helpers.validateEmail(data.payload.email)
                  ? data.payload.email.trim()
                  : false;
  // get token from request header
  const token = typeof(data.headers.token == 'string') ? data.headers.token : false;
  const updateCartData = typeof(data.payload.cartData) == 'object' && data.payload.cartData instanceof Array
                  ? data.payload.cartData
                  : false
  // validate token
  const isValidToken = await verifyToken(token, email);

  if (!isValidToken) {
    return new Response(400, {'Error' : 'Missing required token'});
  }

  if (!updateCartData || !email ) {
    return new Response(400, {'Error' : 'Missing required fields'});
  }

  const isValidCartData = await cartHandlers.isValidCartData(updateCartData);

  if (!isValidCartData) {
    return new Response(400, {'Error' : 'Invalid cart data. Cannot update'});
  }

  // check if shopping cart exists
  const cartData = await _data.read('shoppingcart', token);

  if (!cartData) {
    return new Response(400, {'Error' : `No shopping cart found for token ${token}`});
  }

  // if it does, update the cart by overwriting
  await _data.update('shoppingcart', token, updateCartData);

  return new Response(200);
};

/* 
 * Required fields: token, email
 * Optional fields: None
 */
cartHandlers._cart.delete = async (data, callback) => {
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

  // check if shopping cart exists
  const cart = await _data.read('shoppingcart', token);

  if (!cart) {
    return new Response(400, {'Error' : 'Cart does not exists'});
  }

  // if it does exist, perform delete
  await _data.delete('shoppingcart', token);

  return new Response(200, {'Result' : 'Success'});
};


/* 
 * validate cart data to make sure the format is correct and items contained are valid items from the menu
 * Required fields: token, email
 * Optional fields: None
 */
cartHandlers.isValidCartData = async (cartData) => {
  const cart = typeof(cartData) == 'object' && cartData instanceof Array
                    ? cartData
                    : false;

  if (!cart) return false;

  // if new cartData is an empty array, return true
  if (cart.length == 0) return true;

  // Read menu from stored menu file
  const menu = await _data.read('menu', 'menu');
  
  // init valid flag
  let isValid = true;
  
  cart.forEach( item => {
    // look for cart items in the menu to make sure they are valid
    let validItem = menu.find( menuItem => {
      return menuItem.id == item.id && 
            menuItem.name == item.name && 
            menuItem.price == item.price;
    });

    if (validItem == undefined) {
      isValid = false;
      return;
    }
  });

  return isValid;
};


/*
 * Clear shopping cart on the account associated with provided token and email
 */
cartHandlers.clearShoppingCart = async(token) => {
  // check if shopping cart exists
  const cart = await _data.read('shoppingcart', token);

  if (!cart) return false;

  await _data.update('shoppingcart', token, []);

  return true;
};
// Export module
module.exports = cartHandlers;
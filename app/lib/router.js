/*
 * Router
 *
 */

// Dependencies
const userHandlers = require('../modules/user/handler');
const orderHandlers = require('../modules/order/handler');
const tokenHandlers = require('../modules/token/handler');
const menuHandlers = require('../modules/menu/handler');
const cartHandlers = require('../modules/shoppingcart/handler');
const Response = require('../model/responseModel');

const router = {
  // User handlers
  'users' : userHandlers.users,

  // Token handlers
  'token' : tokenHandlers.tokens,

  // Order handlers
  'orders' : orderHandlers.orders,

  // Menu handlers
  'menu' : menuHandlers.menu,

  // Shopping cart
  'cart' : cartHandlers.shoppingCart,

  // 404
  'notFound' : async (data) => { return new Response(404) },
  // Ping
  'ping' : async (data) => { return new Response(200) },

  // Hello
  'hello' : async (data) => { return new Response(200, {'message' : 'Hello, ' + data.queryStringObject.name}) }
};


// Export module
module.exports = router;

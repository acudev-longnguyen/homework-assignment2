/*
 * Order handlers
 *
 */

// Dependencies
const verifyToken = require('../token/handler').verifyToken;
const helpers = require('../../lib/helpers');
const _data = require('../../lib/data');
const Response = require('../../model/responseModel');
const stripe = require('../../lib/stripe');
const mailgun = require('../../lib/mailgun');
const clearShoppingCart = require('../shoppingcart/handler').clearShoppingCart;

const orderHandlers = {};

orderHandlers.orders = async (data) => {
  var acceptableMethods = ['post']; 
  if (acceptableMethods.indexOf(data.method) > -1) {
    return await orderHandlers._orders[data.method](data);
  } else {
    return new Response(405, {'Error' : 'Method not allowed'})
  }
};

orderHandlers._orders = {};

/* 
 * Required fields: tokenId, email
 * Optional fields: None
 */ 
orderHandlers._orders.post = async (data) => {
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

  if (!cart) {
    return new Response(400, {'Error' : 'Shopping cart does not exists for this token session'});
  }

  if (cart.length < 1) {
    return new Response(400, {'Error' : 'Shopping cart is empty'}); 
  }

  // total cart value in dollar
  let total = 0;

  cart.forEach( item => {
    total += item.price;
  });

  // convert total to cents
  total = total * 100;

  // Create order ID with combination of {email}_{token}_{8 character random string}
  const orderId = `${email}_${token}_${await helpers.createRandomString(8)}`;

  const orderContent = {
    orderId,
    total,
    cart,
    'status' : 'Pending',
    timeCreated : Date.now()
  };

  await _data.create('orders', orderId, orderContent);

  const chargeResult = await stripe.charge(total, 'usd', 'tok_mastercard', `capture payment for order ${orderId}`).catch(ex => {
    console.log('Error occured: ' + ex);
    return new Response(500, ex);
  });

  if (chargeResult.success) {
    // clear shopping cart
    await clearShoppingCart(token);

    // set order status to paid
    orderContent.status = 'Paid';

    // update order in storage
    await _data.update('orders', orderId, orderContent);

    // send mail to notify user
    const sendMailResult = await mailgun
    .sendEmail(email, `Order ${orderId} processed`, `We have charged \$${helpers.convertCentToDollar(total)} on your card for order ${orderId}.\n Your Meal will be delivered within 30 minutes.`)
    .catch(ex => {
      console.log('Error occured: ' + ex);
      return new Response(500, ex);
    });  

    if (!sendMailResult.success) {
      return new Response(400, sendMailResult.responseBody);
    }

    return new Response(200, chargeResult.responseBody);
  } else {
    return new Response(400, chargeResult.responseBody);
  };
  
};

 // Export module
 module.exports = orderHandlers;
/*
 * Handle Stripe API HTTPS requests
 * 
 */

// Dependencies
const https = require('https');
const querystring = require('querystring');
const config = require('./config');

const stripe = {};


/*
 * Charge a card via Stripe API
 * @param amount (Required) - A positive integer representing how much to charge, in the smallest currency unit (e.g., 100 cents to charge $1.00, or 100 to charge ¥100, a zero-decimal currency). The minimum amount is $0.50 USD or equivalent in charge currency.
 * @param currency (Required) - Three-letter ISO currency code, in lowercase.
 * @param source (Optional compulsory since Customer is not support here) - A payment source to be charged. This can be the ID of a card (i.e., credit or debit card), a bank account, a source, a token, or a connected account. For certain sources—namely, cards, bank accounts, and attached sources—you must also pass the ID of the associated customer.
 * @param description (Optional) - An arbitrary string which you can attach to a Charge object. It is displayed when in the web interface alongside the charge. Note that if you use Stripe to send automatic email receipts to your customers, your receipt emails will include the description of the charge(s) that they are describing. This will be unset if you POST an empty value.
 * @param capture (Optional) - Whether to immediately capture the charge. When false, the charge issues an authorization (or pre-authorization), and will need to be captured later. Uncaptured charges expire in seven days.
 */
stripe.charge = async (amount, currency, source, description = '', capture = true) => {
  return new Promise ( (resolve, reject) => {
    const payload = {
      amount,
      currency,
      source,
      description,
      capture
    };

    const payloadString = querystring.stringify(payload);

    const requestDetails = {
      'protocol' : 'https:',
      'hostname' : config.environment.stripe.hostUrl,
      'method' : 'POST',
      'path' : config.environment.stripe.chargePath,
      'headers' : {
        'Content-Type' : 'application/x-www-form-urlencoded',
        'Content-Length' : Buffer.byteLength(payloadString),
        'Authorization' : `Bearer ${config.environment.stripe.apiKey}`
      }
    };

    const req = https.request(requestDetails, async res => {
      // grab response status
      const status = res.statusCode;

      let responseBodyString = '';
      await res.on('data', chunk => {
        responseBodyString += chunk;
      });

      //resolve with response body from Stripe if request went through successful, else Error
      if (status == 200 || status == 201) {
        resolve({'success' : true, 'responseBody' : JSON.parse(responseBodyString)});
      } else {
        resolve({'success' : false, 'responseBody' : JSON.parse(responseBodyString)});
      }
    });

    // Bind request to err event
    req.on('error', (err) => {
      reject(err);
    });

    req.write(payloadString);

    req.end();
  });
  
};


// Export module
module.exports = stripe;
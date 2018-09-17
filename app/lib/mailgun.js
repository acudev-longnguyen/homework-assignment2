/*
 * Handle Mailgun API
 * 
 */

// Dependencies
const https = require('https');
const querystring = require('querystring');
const config = require('./config');

const mailgun = {};


/*
 * Send an email via mailgun API
 * @param to (Required) - Email address of the recipient(s)
 * @param subject (Required) - Message subject
 * @param text (Required) - Body of the message. (text version)
 */
mailgun.sendEmail = async (to, subject, text) => {
  return new Promise ( (resolve, reject) => {
    const payload = {
      'from' : 'postmaster@sandbox0c5b8975b50a491b8a8cf14004871dee.mailgun.org',
      to,
      subject,
      text
    };

    const payloadString = querystring.stringify(payload);

    const requestDetails = {
      'protocol' : 'https:',
      'hostname' : config.environment.mailgun.hostUrl,
      'method' : 'POST',
      'path' : `/v3/${config.environment.mailgun.domain}/messages`,
      'auth' : `api:${config.environment.mailgun.apiKey}`,
      'headers' : {
        'Content-Type' : 'application/x-www-form-urlencoded',
        'Content-Length' : Buffer.byteLength(payloadString)
      }
    };

    const req = https.request(requestDetails, async res => {
      // grab response status
      const status = res.statusCode;

      console.log(status);

      let responseBodyString = '';
      await res.on('data', chunk => {
        responseBodyString += chunk;
      });

      //resolve with response body if request went through successful, else Error
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
module.exports = mailgun;
/*
* Create and export configuration variables
*
*/

// Dependencies
const path = require('path');

const config = {};

config.environments = {
  // Staging (default) environment
  staging : {
    'httpPort' : 3000,
    'httpsPort' : 3001,
    'envName' : 'staging',
    'hashSecret' : 'mySecretKey',
    'stripe' : {
      'hostUrl' : 'api.stripe.com',
      'chargePath' : '/v1/charges',
      'apiKey' : 'sk_test_*******************'  
    },
    'mailgun' : {
      'hostUrl' : 'api.mailgun.net',
      'domain' : 'sandbox***********************.mailgun.org',
      'apiKey' : '*************************************'
    }
  },
  // Production environent
  production : {
    'httpPort' : 8081,
    'httpsPort' : 8181,
    'envName' : 'production',
    'hashSecret' : 'mySecretKey',
    'stripe' : {
      'hostUrl' : 'api.stripe.com',
      'chargePath' : '/v1/charges',
      'apiKey' : 'sk_test_********************'  
    },
    'mailgun' : {
      'hostUrl' : 'api.mailgun.net',
      'domain' : 'sandbox***********************.mailgun.org',
      'apiKey' : '*************************************'
    }
  }
};

// Define log color code
config.colorCode = {
  "Cyan" : '\x1b[36m%s\x1b[0m',
  "Pink" : '\x1b[35m%s\x1b[0m',
  "Green" : '\x1b[32m%s\x1b[0m',
  "Red" : '\x1b[31m%s\x1b[0m'
};

// Path config for HTTPS key and cert
config.httpsKeyPath = path.join(__dirname, '/../https/key.pem');
config.httpsCertPath = path.join(__dirname, '/../https/cert.pem');

// Determine running environment
let currentEnv = typeof (process.env.NODE_ENV) == 'string' ? process.env.NODE_ENV.toLowerCase() : '';

// Check if the default env is one of the environment, If not, default to staging
config.environment = typeof(config.environments[currentEnv]) == 'object' ? config.environments[currentEnv] : config.environments.staging;

// Export the module
module.exports = config;
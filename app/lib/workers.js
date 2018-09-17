/*
 * Worker related tasks
 *
 */

// Dependencies
const _data = require('./data');

// Instantiate worker object
const workers = {};

// Timer to execute the worker process once per minute
workers.loop = () => {
  setInterval(() => {
    workers.cleanUp();
  }, 1000 * 60);
};

workers.cleanUp = async () => {
  const tokenList = await _data.list('tokens').catch(ex => console.log(ex));

  if (tokenList && tokenList.length > 0) {
    tokenList.forEach(async tokenId => {
      // read token data to check for expiration
      const token = await _data.read('tokens', tokenId).catch(ex => console.log(ex));

      // If token is expired, remove it from datasource
      if (token.expires < Date.now()) {
        // remove token
        await _data.delete('tokens', tokenId).catch(ex => console.log(ex));

        // check if there is a shopping cart associated with the token
        const cart = await _data.read('shoppingcart', tokenId).catch(ex => console.log(ex));

        // If so remove any associated shoppingcart with the token
        await _data.delete('shoppingcart', tokenId).catch(ex => console.log(ex));

        console.log(`Successfully cleaned up ${tokenId}`)
      }
    });
  }
};

workers.logRatationLoop = () => {
  setInterval(function() {
    workers.rotateLogs();
  }, 1000 * 60 * 60 * 24);
};

// Init worker
workers.init = function() {
  // Send to console in yellow
  console.log('\x1b[33m%s\x1b[0m', 'Background workers are running');

  // clean up
  workers.cleanUp();

  // start the clean up loop
  workers.loop();
};

 // Export module
 module.exports = workers;
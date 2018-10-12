/*
 * App entry point
 *
 */

// Dependencies
const server = require('./lib/server');
const workers = require('./lib/workers');
const cli = require('./lib/cli');

let app = {};

app.init = () => {

	// Start the server
  server.run();

  // init worker
  workers.init();

  // init cli
  setTimeout( () => {
    cli.init();
  }, 5);
  
};

app.init();

// Export app
module.exports = app;
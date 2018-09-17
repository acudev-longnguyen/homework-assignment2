/*
 * App entry point
 *
 */

// Dependencies
const server = require('./lib/server');
const workers = require('./lib/workers');

let app = {};

app.init = () => {

	// Start the server
	server.run();

  // init worker
  workers.init();
};

app.init();

// Export app
module.exports = app;
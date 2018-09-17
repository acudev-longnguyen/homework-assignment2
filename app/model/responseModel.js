/*
 * Wrapper model for response object
 *
 */
 class Response {

  /*
   * statusCode : number
   * payload : object
   */
  constructor(statusCode, payload) {
    this.statusCode = statusCode;
    this.payload = payload || {};
  }

  payloadToString () {
    return JSON.stringify(this.payload);
  }
 }

// Export the module
 module.exports = Response;
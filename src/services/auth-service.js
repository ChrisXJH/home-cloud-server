module.exports = (() => {
  const { authServerUrl } = require('../config.js');
  const request = require('request');

  function authenticateToken(token) {
    return new Promise((resolve, reject) => {
      const path = `${authServerUrl}/session/${token}`;
      console.log('Authenticating user...');
      console.log('Making request to', path);
      request(path, function(error, response) {
        if (
          !error &&
          response &&
          response.statusCode >= 200 &&
          response.statusCode < 300
        ) {
          console.log('Authentication completed.');
          resolve();
        } else {
          console.log('response status:', response.statusCode);
          console.error(error);
          reject();
        }
      });
    });
  }

  return { authenticateToken };
})();

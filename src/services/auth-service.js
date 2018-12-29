module.exports = (() => {
  const { authServerUrl } = require('../config.js');
  const request = require('request');

  function authenticateToken(token) {
    return new Promise((resolve, reject) => {
      const path = `${authServerUrl}/session/${token}`;
      console.log('Authenticating user...');
      console.log('Making request to', path);
      request(path, function(error, response) {
        if (error) {
          console.error('Failed to authenticate user.', error);
          reject();
          return;
        }
        const { statusCode } = response;
        if (statusCode >= 200 && statusCode < 300) {
          console.error(
            `Failed to authenticate user. Unexpected response status: ${statusCode}`
          );
          reject();
          return;
        }
        console.log('Authentication completed.');
        resolve();
      });
    });
  }

  return { authenticateToken };
})();

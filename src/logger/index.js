// External dependencies
const colors = require('colors');

// Helpers
const genericLogger = (color, message) => {
  console.log(
    color(
      `\n${new Date(Date.now()).toUTCString()} - ${message}`,
    ),
  );
};

const logger = {
  ERROR: (message) => genericLogger(colors.red, `${message}`),
  INFO: (message) => genericLogger(colors.green, `${message}`),
};

// Export logger
module.exports = logger;

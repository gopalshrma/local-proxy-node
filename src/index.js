// External dependencies
const dotenv = require('dotenv');

// Set up env vars
dotenv.config();

// Internal dependencies
const logger = require('./logger/index');
const sshServer = require('./ssh-server');

// Constants
const { SSH_SERVER_PORT } = require('./config/config');

// Start SSH server
sshServer.listen(SSH_SERVER_PORT, '0.0.0.0', () => {
  logger.INFO(`SSH Server - Listening on port ${SSH_SERVER_PORT}`);
});

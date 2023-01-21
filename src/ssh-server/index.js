// External dependencies
const fs = require('fs');
const net = require('net');
const ssh2 = require('ssh2');
const colors = require('colors');

// Internal dependencies
const logger = require('../logger');

// Constants
const CONFIG = require('../config/config');
const CONSTANTS = require('../config/constants');

// Helpers
const validateInfo = (info) => {
  const { bindPort } = info;
  if (!CONFIG.VALID_PORTS.includes(bindPort)) {
    return false;
  }
  return true;
};

// Handlers
const authenticationHandler = (context) => {
  switch (context.method) {
    case CONSTANTS.AUTH_METHODS.PASSWORD: {
      const validAuth = context.username === CONFIG.SSH_SERVER_USERNAME
        && context.password === CONFIG.SSH_SERVER_PASSWORD;
      if (validAuth) {
        context.accept();
      } else {
        logger.ERROR(`SSH Server - Client authentication failed. Invalid username/password - ${context.username}::${context.password}`);
        context.reject();
      }
      break;
    }
    default: {
      context.reject();
    }
  }
};

const requestHandler = (context, client) => {
  const {
    accept, reject, name, info,
  } = context;

  const isInfoValid = validateInfo(info);

  if (!isInfoValid) {
    reject();
    throw new Error('Invalid info. Dropping connection.');
  }

  switch (name) {
    case CONSTANTS.REQUEST_METHODS.FORWARD: {
      accept();
      net.createServer((socket) => {
        socket.setEncoding('utf8');
        client.forwardOut(
          info.bindAddr,
          info.bindPort,
          socket.remoteAddress,
          socket.remotePort,
          (error, upstream) => {
            if (error) {
              socket.end();
              return logger.ERROR(`SSH Server - Error occured in TCP/IP Forward - ${error}`);
            }
            upstream.pipe(socket).pipe(upstream);
            return null;
          },
        );
      }).listen(info.bindPort);
      break;
    }
    default: {
      reject();
    }
  }
};

// SSH Server Setup
let server;
try {
  server = new ssh2.Server({
    hostKeys: [fs.readFileSync('/home/gopal/.ssh/id_rsa')],
  }, (client) => {
    logger.INFO('SSH Server - New client connected');
    client
      .on('authentication', (context) => {
        authenticationHandler(context);
      })
      .on('ready', () => {
        logger.INFO('SSH Server - Client authenticated succesfully');
        client
          .on('session', (accept) => {
            const session = accept();

            session.on('shell', (acp) => {
              const stream = acp();
              stream.on('data', (chunk) => {
                if (chunk.length === 1 && chunk[0] === 0x03) { stream.end(); }
              });
            });

            session.on('pty', (acp) => acp());
          })
          .on('request', (accept, reject, name, info) => {
            const context = {
              accept, reject, name, info,
            };
            requestHandler(context, client);
          });
      });
  });
} catch (error) {
  logger.ERROR(`SSH Server - Error occurred - ${error}`);
}

// Export ssh server
module.exports = server;

const path = require('path');

const routes = (handler) => [
  {
    method: 'POST',
    path: '/albums/{id}/covers',
    handler: handler.postUploadImageHandler,
    options: {
      payload: {
        maxBytes: 512000,
        allow: 'multipart/form-data',
        multipart: true,
        output: 'stream',
      },
    },
  },
  {
    method: 'GET',
    path: '/upload/images/{param*}',
    handler: {
      directory: {
        path: path.resolve(__dirname, 'file/images'),
      },
    },
  },
];

module.exports = routes;

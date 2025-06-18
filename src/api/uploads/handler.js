const ClientError = require('../../exceptions/ClientError');
const { message } = require('../../validator/exports/schema');
 
class UploadsHandler {
  constructor(service, validator) {
    this._service = service;
    this._validator = validator;
 
    this.postUploadImageHandler = this.postUploadImageHandler.bind(this);
  }
 
  async postUploadImageHandler(request, h) {
    const { cover } = request.payload;
    const { id: albumId } = request.params;
    this._validator.validateImageHeaders(cover.hapi.headers);
 
    const filename = await this._service.writeFile(cover, cover.hapi);
 
    await this._service.addCoverToAlbum(albumId, filename);

    const response = h.response({
      status: 'success',
      message: 'Sampul berhasil diunggah',
    });
    response.code(201);
    return response;
  }
}
 
module.exports = UploadsHandler;
const ClientError = require('../../exceptions/ClientError');

class ExportsHandler {
  constructor(service, validator) {
    this._service = service;
    this._validator = validator;

    this.postExportPlaylistHandler = this.postExportPlaylistHandler.bind(this);
  }

  async postExportPlaylistHandler(request, h) {
    this._validator.validateExportPlaylistsPayload(request.payload);

    const { playlistId } = request.params;
    const { targetEmail } = request.payload;
    const { id: credentialId } = request.auth.credentials;

    // Cek apakah user ini adalah pemilik playlist
    await this._service.playlistService.verifyPlaylistOwner(playlistId, credentialId);

    const message = {
      playlistId,
      targetEmail,
    };

    await this._service.producerService.sendMessage('export:playlists', JSON.stringify(message));

    const response = h.response({
      status: 'success',
      message: 'Permintaan Anda sedang kami proses',  // sesuai dengan spesifikasi
    });
    response.code(201);
    return response;
  }

}

module.exports = ExportsHandler;

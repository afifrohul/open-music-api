class AlbumsHandler {
  constructor(service, validator) {
    this._service = service;
    this._validator = validator;
 
    this.postAlbumHandler = this.postAlbumHandler.bind(this);
    this.getAlbumByIdHandler = this.getAlbumByIdHandler.bind(this);
    this.putAlbumByIdHandler = this.putAlbumByIdHandler.bind(this);
    this.deleteAlbumByIdHandler = this.deleteAlbumByIdHandler.bind(this);
    this.postAlbumLikeHandler = this.postAlbumLikeHandler.bind(this);
    this.deleteAlbumLikeHandler = this.deleteAlbumLikeHandler.bind(this);
    this.getAlbumLikesHandler = this.getAlbumLikesHandler.bind(this);
  }
  async postAlbumHandler(request, h) {
    this._validator.validateAlbumPayload(request.payload);
    const { name = 'untitled', year } = request.payload;

    const albumId = await this._service.addAlbum({ name, year });

    const response = h.response({
      status: 'success',
      message: 'Album berhasil ditambahkan',
      data: {
        albumId,
      },
    });
    response.code(201);
    return response;
  }
 
  async getAlbumByIdHandler(request, h) {
    const { id } = request.params;
    const album = await this._service.getAlbumById(id);
    return {
      status: 'success',
      data: {
        album,
      },
    };
  }
 
  async putAlbumByIdHandler(request, h) {
    this._validator.validateAlbumPayload(request.payload);
    const { id } = request.params;
 
    await this._service.editAlbumById(id, request.payload);
 
    return {
      status: 'success',
      message: 'Album berhasil diperbarui',
    };
  }
 
  async deleteAlbumByIdHandler(request, h) {
    const { id } = request.params;
    await this._service.deleteAlbumById(id);
 
    return {
      status: 'success',
      message: 'Album berhasil dihapus',
    };
  }

  async postAlbumLikeHandler(request, h) {
    const { id } = request.params;
    const { id: credentialId } = request.auth.credentials;

     await this._service.verifyAlbumExists(id); 

    await this._service.addAlbumLike(id, credentialId);

    const response = h.response({
      status: 'success',
      message: 'Like album berhasil ditambahkan',
    });
    response.code(201);
    return response;
  }

  async deleteAlbumLikeHandler(request, h) {
    const { id } = request.params;
    const { id: credentialId } = request.auth.credentials;

    await this._service.deleteAlbumLike(id, credentialId);

    return {
      status: 'success',
      message: 'Like album berhasil dihapus',
    };
  }

  async getAlbumLikesHandler(request, h) {
    const { id } = request.params;

    const likes = await this._service.getAlbumLikesCount(id);

    return {
      status: 'success',
      data: {
        likes,
      },
    };
  }

}
 
module.exports = AlbumsHandler;
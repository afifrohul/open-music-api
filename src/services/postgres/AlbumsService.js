const { Pool } = require('pg');
const { nanoid } = require('nanoid');
const InvariantError = require('../../exceptions/InvariantError');
const NotFoundError = require('../../exceptions/NotFoundError');

class AlbumsService {
  constructor(cacheService) {
    this._pool = new Pool();
    this._cacheService = cacheService;
  }
  async addAlbum({ name, year }) {
    const id = `album-${nanoid(16)}`
 
    const query = {
      text: 'INSERT INTO albums VALUES($1, $2, $3) RETURNING id',
      values: [id, name, year],
    };
 
    const result = await this._pool.query(query);
 
    if (!result.rows[0].id) {
      throw new InvariantError('Album gagal ditambahkan');
    }
 
    return result.rows[0].id;
  }

  async getAlbumById(id) {
    const query = {
      text: 'SELECT id, name, year, cover FROM albums WHERE id = $1',
      values: [id],
    };
    const result = await this._pool.query(query);

    if (!result.rows.length) {
      throw new NotFoundError('Album tidak ditemukan');
    }

    const album = result.rows[0];

    // Tambahkan coverUrl lengkap jika cover ada
    return {
      id: album.id,
      name: album.name,
      year: album.year,
      coverUrl: album.cover 
        ? `http://${process.env.HOST}:${process.env.PORT}/upload/images/${album.cover}`
        : null,
    };
  }

  async editAlbumById(id, { name, year }) {
    const query = {
      text: 'UPDATE albums SET name = $1, year = $2 WHERE id = $3 RETURNING id',
      values: [name, year, id],
    };
 
    const result = await this._pool.query(query);
    if (!result.rows.length) {
      throw new NotFoundError('Gagal memperbarui Album. Id tidak ditemukan');
    }
  }

  async deleteAlbumById(id) {
    const query = {
      text: 'DELETE FROM albums WHERE id = $1 RETURNING id',
      values: [id],
    };
 
    const result = await this._pool.query(query);
 
    if (!result.rows.length) {
      throw new NotFoundError('Album gagal dihapus. Id tidak ditemukan');
    }
  }

  async verifyAlbumExists(id) {
    const query = {
      text: 'SELECT id FROM albums WHERE id = $1',
      values: [id],
    };
    const result = await this._pool.query(query);

    if (!result.rows.length) {
      throw new NotFoundError('Album tidak ditemukan');
    }
  }

  async addAlbumLike(albumId, userId) {
    const checkQuery = {
      text: 'SELECT id FROM user_album_likes WHERE album_id = $1 AND user_id = $2',
      values: [albumId, userId],
    };

    const checkResult = await this._pool.query(checkQuery);

    if (checkResult.rows.length > 0) {
      throw new InvariantError('User sudah menyukai album ini');
    }

    const id = `album-like-${nanoid(16)}`;
    const insertQuery = {
      text: 'INSERT INTO user_album_likes (id, album_id, user_id) VALUES ($1, $2, $3) RETURNING id',
      values: [id, albumId, userId],
    };

    const insertResult = await this._pool.query(insertQuery);

    if (!insertResult.rows.length) {
      throw new InvariantError('Gagal menambahkan like pada album');
    }

    // Hapus cache agar cache invalid
    await this._cacheService.delete(`album_likes:${albumId}`);
  }


  async getAlbumLikesCount(id) {
    try {
      const result = await this._cacheService.get(`album_likes:${id}`);
      
      return {
        source: 'cache',
        likes: parseInt(result, 10),
      };
    } catch (error) {
      const query = {
        text: 'SELECT COUNT(*) AS likes FROM user_album_likes WHERE album_id = $1',
        values: [id],
      };
      const result = await this._pool.query(query);

      if (!result.rows.length) {
        throw new NotFoundError('Album tidak ditemukan');
      }

      const likes = parseInt(result.rows[0].likes, 10);

      await this._cacheService.set(`album_likes:${id}`, likes);

      return {
        source: 'database',
        likes,
      };
    }
  }

  async deleteAlbumLike(albumId, userId) {
    const query = {
      text: 'DELETE FROM user_album_likes WHERE album_id = $1 AND user_id = $2 RETURNING id',
      values: [albumId, userId],
    };

    const result = await this._pool.query(query);

    if (!result.rows.length) {
      throw new InvariantError('Gagal menghapus like pada album');
    }

    await this._cacheService.delete(`album_likes:${albumId}`);
  }

}

module.exports = AlbumsService;
const { Pool } = require('pg');
const { nanoid } = require('nanoid');
const InvariantError = require('../../exceptions/InvariantError');
const NotFoundError = require('../../exceptions/NotFoundError');
const AuthorizationError = require('../../exceptions/AuthorizationError');

class PlaylistsService {
	constructor() {
		this._pool = new Pool()
	}

	async verifyPlaylistOwner(id, owner) {
		const query = {
			text: 'SELECT * FROM playlists WHERE id = $1',
			values: [id],
		};
		
		const result = await this._pool.query(query);
		
		if (!result.rows.length) {
			throw new NotFoundError('Resource yang Anda minta tidak ditemukan');
		}
		
		const playlist = result.rows[0];
		
		if (playlist.owner !== owner) {
			throw new AuthorizationError('Anda tidak berhak mengakses resource ini');
		}
	}

	async addPlaylist({name, owner}) {
		const id = `playlist-${nanoid(16)}`

		const query = {
			text: 'INSERT INTO playlists VALUES($1, $2, $3) RETURNING id',
			values: [id, name, owner],
		};

		const result = await this._pool.query(query);

		if (!result.rows[0].id) {
			throw new InvariantError('Playlist gagal ditambahkan');
		}

		return result.rows[0].id;
	}

	async getPlaylists(owner) {
		const query = {
			text: `SELECT playlists.id, playlists.name, users.username
			FROM playlists
			JOIN users ON playlists.owner = users.id
			WHERE playlists.owner = $1`,
			values: [owner],
		}
		const result = await this._pool.query(query);
		return result.rows;
	}

	async deletePlaylistById(id) {
    const query = {
      text: 'DELETE FROM playlists WHERE id = $1 RETURNING id',
      values: [id],
    };
 
    const result = await this._pool.query(query);
 
    if (!result.rows.length) {
      throw new NotFoundError('Playlist gagal dihapus. Id tidak ditemukan');
    }
  }

	async addPlaylistSong(playlistId, { songId }) {

		const checkSongQuery = {
			text: 'SELECT id FROM songs WHERE id = $1',
			values: [songId],
    };

    const songResult = await this._pool.query(checkSongQuery);

    if (!songResult.rows.length) {
			throw new NotFoundError('Lagu tidak ditemukan');
    }

		const id = `playlist-song-${nanoid(16)}`

		const query = {
			text: 'INSERT INTO "playlist-songs" VALUES($1, $2, $3) RETURNING id',
			values: [id, playlistId, songId],
		};

		const result = await this._pool.query(query);

		if (!result.rows[0].id) {
			throw new InvariantError('Lagu gagal ditambahkan ke playlist');
		}

		return result.rows[0].id;
	}

	async getPlaylistSongs(playlistId) {
  const query = {
    text: `
      SELECT 
        playlists.id AS playlist_id,
        playlists.name AS playlist_name,
        users.username AS username,
        songs.id AS song_id,
        songs.title AS song_title,
        songs.performer AS song_performer
      FROM playlists
      LEFT JOIN users ON playlists.owner = users.id
      LEFT JOIN "playlist-songs" ON playlists.id = "playlist-songs".playlist_id
      LEFT JOIN songs ON "playlist-songs".song_id = songs.id
      WHERE playlists.id = $1
    `,
    values: [playlistId],
  };

  const result = await this._pool.query(query);
  
  if (!result.rows.length) {
    throw new NotFoundError('Playlist tidak ditemukan');
  }

  const { playlist_id, playlist_name, username } = result.rows[0];

  const songs = result.rows
			.filter(row => row.song_id !== null)
			.map(row => ({
				id: row.song_id,
				title: row.song_title,
				performer: row.song_performer,
			}));

		return {
			id: playlist_id,
			name: playlist_name,
			username,
			songs,
		};
	}

	async deletePlaylistsSongById(playlist_id, {songId}) {
    const query = {
      text: 'DELETE FROM "playlist-songs" WHERE playlist_id = $1 AND  song_id = $2 RETURNING id',
      values: [playlist_id, songId],
    };
 
    const result = await this._pool.query(query);
 
    if (!result.rows.length) {
      throw new NotFoundError('Playlist gagal dihapus. Id tidak ditemukan');
    }
  }


}

module.exports = PlaylistsService
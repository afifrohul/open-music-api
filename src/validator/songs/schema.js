const Joi = require('joi');
 
const SongPayloadSchema = Joi.object({
  title: Joi.string().required(),
  year: Joi.number().integer().required(),
  performer: Joi.string().required(),
  genre: Joi.string().required(),
  duration: Joi.number().integer().min(0).optional(),
  album_id: Joi.string().optional(),
});

module.exports = { SongPayloadSchema };
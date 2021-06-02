const { Rooms } = require('../../database/models');
const createError = require('../createError');

const createRoom = async (room, userRole) => {
  if (userRole !== 'super_admin' && userRole !== 'admin' && userRole !== 'normal') {
    throw createError(
      403,
      'Forbidden',
      'Guest is not allowed to create new rooms.'
    );
  }

  return Rooms.create(room);
};

module.exports = createRoom;

const joinRoom = require('./joinRoom');
const leaveRoom = require('./leaveRoom');
const { publicMessage, privateMessage, pokeMessage } = require('./msgHandler');
const { kickUser, banUser, banUserByAdmin } = require('./userHandler');
const {sendSignal, returnSignal} = require('./videoHandler');
const socketDisconnect = require('./disconnect');

const ioHandler = (io) => (socket) => {
    socket.on('join room', joinRoom(io, socket));
    socket.on('leave room', leaveRoom(io, socket));

    // message events
    socket.on('public message', publicMessage(io, socket));
    socket.on('private message', privateMessage(io, socket));
    socket.on('poke message', pokeMessage(io, socket));
    socket.on('kick user', kickUser(io, socket));
    socket.on('ban user', banUser(io, socket));
    // video events
    socket.on('sending video signal', sendSignal(io));
    socket.on('returning video signal', returnSignal(io));

    socket.on('error', (err) => {
      console.log(err);
    });

    socket.on('disconnecting', socketDisconnect(io, socket));
    socket.on('disconnect', (reason) => {
      console.log(reason)
    })
};

const adminIoHandler = (io) => (socket) => {
    io.on('ban user', banUserByAdmin(io, socket));
}

module.exports = {ioHandler, adminIoHandler};

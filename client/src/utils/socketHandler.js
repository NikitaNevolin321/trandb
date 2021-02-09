import io from 'socket.io-client';
import config from '../config'
const socket = io(`${config.server_url}`,{
    autoConnect: false,
});

// const adminSocket = io({
//     autoConnect: false,
// })
// const socketOn = {

//     // when other user joined to room
//     joinedRoom: (callback) => {
//         socket.on('joined room', payload => {
//             callback(payload);
//         })
//     },
//     roomMessages: (callback) => {
//         socket.on('room messages', (payload) => {
//             callback(payload);
//         })
//     }
// }

// const socketEmit = {
//     joinRoom: (room, callback) => {
//         socket.emit('join room', {room}, err => callback(err));
//     },
//     clientMessage: (message, room, username, date, callback) => {
//         socket.emit('client message', { message, room, username, date}, err => callback(err));
//     }
// }

// const socketClose = () => {
//     socket.removeAllListeners();
//     socket.close();
// }

const getSocket = () => {
    return socket;
}

export { getSocket };
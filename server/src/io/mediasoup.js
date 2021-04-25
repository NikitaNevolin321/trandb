const {roomList, workers, getMediasoupWorker, Room, Peer} = require('../media');

const createMediaRoom = (io, socket) => async ({
    room_id
}, callback) => {
    console.log('create room');
    if (roomList.has(room_id)) {
        callback('already exists')
    } else {
        console.log('---created room--- ', room_id)
        let worker = await getMediasoupWorker()
        roomList.set(room_id, new Room(room_id, worker, io))
        callback(room_id)
    }
}

const joinMedia = (io, socket) =>  ({
    room_id,
    name
}, cb) => {

    console.log('---user joined--- \"' + room_id + '\": ' + name + socket.id)
    if (!roomList.has(room_id)) {
        return cb({
            error: 'room does not exist'
        })
    }
    roomList.get(room_id).addPeer(new Peer(socket.id, name, room_id, io))

    // cb(roomList.get(room_id).toJson())
    cb(true);
};

const getProducers = (io, socket) => (room_id) => {
    console.log(`---get producers--- name:${roomList.get(room_id).getPeers().get(socket.id).name}`)
    // send all the current producer to newly joined member
    if (!roomList.has(room_id)) return
    let producerList = roomList.get(room_id).getProducerListForPeer(socket.id)

    socket.emit('newProducers', producerList)
}

const getRouterRtpCapabilities = (io, socket) => (room_id, callback) => {
    try {
        console.log(`---get RouterRtpCapabilities--- name: ${roomList.get(room_id).getPeers().get(socket.id).name}`)
        callback(roomList.get(room_id).getRtpCapabilities());
    } catch (e) {
        callback({
            error: e.message
        })
    }

};

const createWebRtcTransport = (io, socket) => async ({room_id}, callback) => {
    try {
        console.log(`---create webrtc transport--- name: ${roomList.get(room_id).getPeers().get(socket.id).name}`)
        const {
            params
        } = await roomList.get(room_id).createWebRtcTransport(socket.id);

        callback(params);
    } catch (err) {
        console.error(err);
        callback({
            error: err.message
        });
    }
};

const connectTransport = (io, socket) => async ({
    transport_id,
    dtlsParameters,
    room_id
}, callback) => {
    console.log(`---connect transport--- name: ${roomList.get(room_id).getPeers().get(socket.id).name}`)
    if (!roomList.has(room_id)) return
    await roomList.get(room_id).connectPeerTransport(socket.id, transport_id, dtlsParameters)
    
    callback('success')
};

const produce = (io, socket) => async ({
    kind,
    rtpParameters,
    producerTransportId,
    room_id,
    name,
    locked
}, callback) => {
    console.log('new producer started')
    if(!roomList.has(room_id)) {
        return callback({error: 'not is a room'+room_id})
    }

    let producer_id = await roomList.get(room_id).produce(socket.id, producerTransportId, rtpParameters, kind, name, locked)
    console.log(`---produce--- type: ${kind} name: ${roomList.get(room_id).getPeers().get(socket.id).name} id: ${producer_id}`)
    callback({
        producer_id
    })
}

const consume = (io, socket) => async ({
    consumerTransportId,
    producerId,
    rtpCapabilities,
    room_id
}, callback) => {
    //TODO null handling
    let room = roomList.get(room_id);
    if(room) {
        let params = await roomList.get(room_id).consume(socket.id, consumerTransportId, producerId, rtpCapabilities)
        console.log(`---consuming--- name: ${roomList.get(room_id) && roomList.get(room_id).getPeers().get(socket.id).name} prod_id:${producerId} consumer_id:${params.id}`)
        callback(params)
        // let producerList = room.getProducerListForPeer();
        // let producerInfo = producerList.find(({producer_id}) => (producer_id === producerId));
        // if(producerInfo) {
        //     let {producer_socket_id, producer_id} = producerInfo;
        //     let {name} = params;
        //     // if(producer_socket_id) {
        //     //     socket.to(producer_socket_id).emit('start view', {name, producer_id, room_id});
        //     // }
        // }
        
    } else {
        callback(false);
    }
    
}

const resume = () => async (data, callback) => {

    await consumer.resume();
    callback();
};

const getMyRoomInfo = () => (room_id, cb) => {
    cb(roomList.get(room_id).toJson())
}

// socket.on('disconnect', () => {
//     // console.log(`---disconnect--- name: ${roomList.get(room_id) && roomList.get(room_id).getPeers().get(socket.id).name}`)
//     // // if (!socket.room_id) return
//     let room_ids = Array.isArray(socket.rooms) ? socket.rooms : [];
//     room_ids.map((room_id) => {
//         let room = roomList.get(room_id)
//         if(room) {
//             room.removePeer(socket.id);
//         }
//     })
// })

const producerClosed = () => ({
    producer_id,
    room_id
}) => {
    console.log(`---producer close--- name: ${roomList.get(room_id) && roomList.get(room_id).getPeers().get(socket.id).name}`)
    roomList.get(room_id).closeProducer(socket.id, producer_id)
}

const roomProducersClosed = (socket) => ({
    room_id
}) => {
    roomList.get(room_id).closeAllProducers(socket.id);
}

const startView = (io, socket) => ({room_id, name, socket_id}) => {
    console.log('start view', socket_id, socket.id, name)
    socket.to(socket_id).emit('start view', {
        room_id,
        name
    })
}

const stopView = (io, socket) => ({room_id, name, socket_id}) => {
    
    socket.to(socket_id).emit('stop view', {
        room_id,
        name
    })
}

const viewRequest = (io, socket) => async ({roomName, username, targetId}, callback) => {
    
    let socketIds = await io.of('/').in(roomName).allSockets();
    let socketToPrivate = null;
    socketIds.forEach((element) => {
        let socket = io.sockets.sockets.get(element);
        if(targetId === socket.decoded._id) {
            socketToPrivate = socket;
        }
    });

    if(!socketToPrivate) {
        return callback(false, 'no broadcaster')
    }
    let room = roomList.get(roomName);
    if(!room) {
        return callback(false, 'no media room');
    }

    let peer = room.peers.get(socketToPrivate.id);
    if(!peer) {
        return callback(false, 'no peer');
    }
    if(peer.checkBlock(username)) {
        return callback(false, 'blocked')
    }

    // if(peer.checkAllow(username)) {
    //     return callback(true);
    // }
    
    socketToPrivate.emit('view request', {
        roomName,
        username,
    }, (result) => {
        if(!result) {
            peer.addBlock(username);
        } else {
            peer.addAllow(username);
        }
        callback(result);
    });
}

// stop streaming for this person
const stopBroadcastTo = (io, socket) => async({room_id, name, targetId}) => {
    let socketIds = await io.of('/').in(room_id).allSockets();
    let socketToPrivate = null;
    socketIds.forEach((element) => {
        let socket = io.sockets.sockets.get(element);
        if(targetId === socket.decoded._id) {
            socketToPrivate = socket;
        }
    });
    if(!socketToPrivate) {
        return callback(false, 'no broadcaster')
    }
    let room = roomList.get(room_id);
    if(room) {
        let peer = room.peers.get(socketToPrivate.id);
        if(peer) {
            peer.addBlock(name);
        }
    }
    socketToPrivate.emit('stop broadcast', {
        room_id,
        name,
    });
}

// socket.on('exitRoom', async (room_id, callback) => {
//     console.log(`---exit room--- name: ${roomList.get(room_id) && roomList.get(room_id).getPeers().get(socket.id).name}`)
//     if (!roomList.has(room_id)) {
//         callback({
//             error: 'not currently in a room'
//         })
//         return
//     }
//     // close transports
//     await roomList.get(room_id).removePeer(socket.id)
//     if (roomList.get(room_id).getPeers().size === 0) {
//         roomList.delete(room_id)
//     }

//     // socket.room_id = null
//     socket.leave(room_id);


//     callback('successfully exited room')
// })

// socket.on('exit', async (_, callback) => {
//     // if (!roomList.has(room_id)) {
//     //     callback({
//     //         error: 'not currently in a room'
//     //     })
//     //     return
//     // }
//     // close transports
//     let rooms = socket.rooms;
//     if(rooms && rooms.length) {
//         rooms.forEach(async (room_id) => {
//             if(roomList.has(room_id)) {
//                 await roomList.get(room_id).removePeer(socket.id)
//                 if (roomList.get(room_id).getPeers().size === 0) {
//                     roomList.delete(room_id)
//                 }
//                 // socket.room_id = null
//                 socket.leave(room_id);
//             }
//         })
        
//     }
//     callback('successfully exited room')
// })

module.exports = {
    createMediaRoom,
    joinMedia,
    getProducers,
    getRouterRtpCapabilities,
    createWebRtcTransport,
    connectTransport,
    produce,
    consume,
    resume,
    producerClosed,
    roomProducersClosed,
    startView,
    stopView,
    viewRequest,
    stopBroadcastTo
}
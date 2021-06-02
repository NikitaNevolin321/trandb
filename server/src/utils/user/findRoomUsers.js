const { Rooms, Users } = require('../../database/models');

const findRoomUsers = async (room, myRole) => {
    const roomInfo = await Rooms.findOne({ name: room });
    if(roomInfo) {
        const owner = roomInfo.owner;
        const moderators = roomInfo.moderators;
        let liveUserIds = roomInfo.users;
        const roomUsers = await Users.find({ _id: { $in: liveUserIds? liveUserIds: []  } });
        const usersInfo = roomUsers.map(({ _id, username, gender, role, avatar, ip }) => {
            // let ip;
            // // if(myRole === 'admin') {
            //     let result = roomInfo.users.find((item)=>(item._id.equals(_id)));
            //     ip = result.ip;
            // // }
            let userRole = role;
            if(role === 'normal') {
                if(_id.equals(owner)) {
                    userRole = 'owner';
                } else if(moderators.includes(_id)) {
                    userRole = 'moderator';
                } else {
                }
            }
            return {_id, username, gender, role: userRole, ip, avatar};    
        }// ({_id, username, gender, role, avatar }));
        );
        return usersInfo;
    }
    return [];
    // console.log(roomUsers);
};

module.exports = findRoomUsers;

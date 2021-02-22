const {Blocks} = require("../../database/models")
const ipInt = require('ip-to-int');
const checkBlock = async (roomName, username, ipNum) => {
    let block = await Blocks.findOne({
        $or: [
            {room: roomName, username},
            {room: roomName, ip: ipNum},
        ]
        
    });
    
    return block? true :false;
}

module.exports = checkBlock;

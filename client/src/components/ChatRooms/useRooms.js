import React, { useState, useReducer, useEffect, useContext, useRef, useCallback } from 'react';
import { socket, mediaSocket, useLocalStorage, isPrivateRoom } from '../../utils';
import RoomObject from '../../utils/roomObject';
import {UserContext, SettingContext} from '../../context';
import { useTranslation } from 'react-i18next';
import { useSnackbar } from 'notistack';
import { useHistory } from 'react-router-dom';
import {useAudio} from 'react-use';

function roomReducer(state, action) {
    switch (action.type) {
        case 'pending': {
            return {status: 'pending', data: null, error: null}
        }
        case 'init': {
            return {status: 'resolved', data: action.data, error: null}
        }
        case 'update': {
            if(state.data) {
                let {name: oldName} = state.data;
                let {name: newName} = action.data;
                if(oldName === newName) {
                    return {status: 'resolved', data: {...state.data, ...action.data}, error: null};
                }
            }
            return state;
        }
        case 'rejected': {
            return {status: 'rejected', data: null, error: action.error}
        }
        default: {
            throw new Error(`Unhandled action type: ${action.type}`)
        }
    }
}

function roomsReducer(state, action) {
    switch (action.type) {
        case 'add': {
            console.log('add room info')
            return {status: 'resolved', data: [...state.data, action.data], roomIndex: state.data.length, error: null}
        }
        case 'remove': {
            let {data} = state;
            let newData = data?.filter((item)=>(item.name !== action.data));
            if(Array.isArray(newData) && newData.length) {
                return {status: 'resolved', data, error: null};
            } else {
                return {status: 'rejected', data: null, error: 'remove all rooms'}
            }
        }
        case 'set': {
            return {
                status: 'resolved', data: action.data,
                roomIndex: ((!isNaN(action.roomIndex)) && action.roomIndex >= 0) ? action.roomIndex: state.roomIndex,
                error: null
            };
        }
        default: {
            throw new Error(`Unhandled action type: ${action.type}`)
        }
    }
}

const useRooms = ({initRoomName, ...initalState}) => {

    const history= useHistory();
    const roomsRef = useRef([]);
    const [roomsState, roomsDispatch] = useReducer(roomsReducer, {
        status: 'idle',
        data: [],
        roomIndex: null,
        error: null,
    });
    const { username, avatar, gender, role } = useContext(UserContext);
    const {enablePokeSound, enablePrivateSound, enablePublicSound, enableSysMessage, messageNum} = useContext(SettingContext);
    // current room state
    const [state, dispatch] = useReducer(roomReducer, {
        status: 'idle',
        data: null,
        error: null,
    });
    const [globalBlocks, setGlobalBlocks] = useState([]);
    const [mutes, setMutes] = useLocalStorage('mutes', []);
    const privateListRef = useRef();
    const [roomEvent, setRoomEvent] = useState(null);
    const { t, i18n } = useTranslation();
    const { enqueueSnackbar, closeSnackbar } = useSnackbar();
    const [openDisconnectModal, setOpenDisconnectModal] = useState(false);

    const roomNameRef = React.useRef(initRoomName);

    const [pokeAudio, pokeAudioState, pokeAudioControls] = useAudio({
        src: '/media/poke.mp3',
        autoPlay: false ,
    });
    const [publicAudio, publicAudioState, publicAudioControls] = useAudio({
        src: '/media/public.mp3',
        autoPlay: false ,
    });
    const [privateAudio, privateAudioState, privateAudioControls] = useAudio({
        src: '/media/private.mp3',
        autoPlay: false ,
    });

    const {status, data, error} = state;
    const {status: roomsStatus, data: roomsData, roomIndex, error: roomsError} = roomsState;

    const changeRoom = (newRoomIndex) => {
       
        let room = roomsRef.current[newRoomIndex];
        room.mergeUnreadMessages();
        data.name = room.name;
        data.messages = room.messages;
        data.users = room.onlineUsers;
        data.blocks = room.blocks;
        data.mutes = room.mutes
        data.unReadMessages = room.unReadMessages;
        data.users = room.users;
        dispatch({type: 'init', data});
        roomNameRef.current = room.name;
        let newRoomsData = roomsRef.current.map(({name, unReadMessages}) => ({name, unReadMessages}));
        console.log(newRoomIndex, newRoomsData, roomsState)
        roomsDispatch({type: 'set', data: newRoomsData, roomIndex: newRoomIndex});
    }

    const initRoom = ({room, globalBlocks, onlineUsers, messages, blocks}) => {
        let data = {};
        if(roomsRef.current && room) {
            if(Array.isArray(globalBlocks)) {
                setGlobalBlocks(globalBlocks);
            }
            let sameRoom = roomsRef.current.find((item) => (item.name === room.name));
            if(!sameRoom) {
                let newMessages = null;
                if(room.welcomeMessage) {
                    let wcMsg = {
                        type: 'system',
                        msg: room.welcomeMessage
                    };
                    newMessages = [wcMsg, ...messages];
                }
                
                let newRoomObject = new RoomObject(room.name, newMessages? newMessages: messages, onlineUsers, blocks, messageNum);
                roomsRef.current.push(newRoomObject);
                data.name = room.name;
                data.messages = newRoomObject.messages;
                data.users = onlineUsers;
                data.blocks = blocks;
                data.mutes = newRoomObject.mutes
                data.unReadMessages = newRoomObject.unReadMessages;
                dispatch({type: 'init', data});
                roomNameRef.current = room.name;
                roomsDispatch({type: 'add', data: {
                        name: room.name,
                        unReadMessages: newRoomObject.unReadMessages
                    }
                })
                // setRoomIndex(roomsRef.current.length-1);
            } else {
                if(blocks) {
                    sameRoom.updateBlocks(blocks);
                }
                if(onlineUsers) {
                    let users = onlineUsers.map((user) => ({...user}))
                    sameRoom.users = users;
                }
                if(messages) {
                    sameRoom.setMessages(messages);
                }
            }
            // if(mediaClientRef.current) {
            //     await mediaClientRef.current?.init();
            //     await mediaClientRef.current?.createRoom(room.name);
            //     await mediaClientRef.current?.join(room.name);
            // }
        }
    }

    const addRoom = async (room, callback) => {
        let roomNames = await roomsRef.current.map((oneRoom) => (oneRoom.name));
        if(room && roomNames && !roomNames.includes(room)) {
            isPrivateRoom(room, ({isPrivate}) => {
                if(isPrivate) {
                    callback(false, 'password');
                } else {
                    socket.emit('join room', { room }, (result, message) => {
                        if(result) {
                        } else {
                            enqueueSnackbar(message, {variant: 'error'})
                        }
                    });
                }
            }, (err) => {
                console.log(err);
            })
        // socket.emit('join room', { room });
            callback(true);
        } else {
            callback(false, 'already_entered');
        }
    }

    const addUser = ({room, joinedUser, onlineUsers}) => {
        if(roomsRef.current) {
            let sameRoom = roomsRef.current.find((item) => (item.name === room));
            if(sameRoom) {
                let usernames = onlineUsers.map((item) => (item.username));
                if(username && usernames.includes(username)) {
                    let newData = {name: room};
                    if(joinedUser) {
                        if(sameRoom.addOnlineUser(joinedUser)) {
                            if(username !== joinedUser.username && enableSysMessage) {
                                let sysMsg = {
                                    type: 'system',
                                    msg: t('ChatApp.sys_join_room', {username: joinedUser.username})
                                    // msg: joinedUser.username + ' joined the room'
                                }
                                sameRoom.addMessages([sysMsg]);
                                newData.messages = sameRoom.messages;
                            }
                            newData.users = sameRoom.users;
                            dispatch({type: 'update',
                                data: newData
                            })
                        }
                    }
                }
            }
        }
    }

    const removeUser = ({room, leavedUser}) => {
        if(roomsRef.current) {
            let sameRoom = roomsRef.current.find((item) => (item.name === room));
            if(sameRoom) {
                let leavedUserInfo = sameRoom.users.find((user) => (user._id === leavedUser));
                if(leavedUserInfo) {
                    let newData = {name: room};
                    sameRoom.removeOnlineUser(leavedUser);
                    newData.users = sameRoom.users;
                    if(enableSysMessage) {
                        let message = {
                            type: 'system',
                            msg: t('ChatApp.sys_leave_room', {username: leavedUserInfo.username}) 
                        }
                        sameRoom.addMessages([message]);
                        newData.messages = sameRoom.messages;
                    }
                    dispatch({type: 'update',
                        data: newData
                    })
                } else {
                    //you leaved from room by server
                }
            }
        }
    }

    const kickUser = ({room, kickedUserName, type}) => {
        if(roomsRef.current && room) {
            let sameRoom = roomsRef.current.find((item) => (item.name === room));
            if(sameRoom) {
                let kickedUser = sameRoom.users.find(({username}) => (username === kickedUserName));
                if(username !== kickedUserName) { // kick other
                    if(kickUser) {
                        sameRoom.removeOnlineUser(kickedUser._id);
                        let msg = (type === 'kick') 
                            ? t('ChatApp.sys_kick_room',{username: kickedUserName})
                            : t('ChatApp.sys_ban_owner_room',{username: kickedUserName});
                        let message = {
                            type: 'system',
                            msg
                        }
                        sameRoom.addMessages([message]);
                        let newData = {
                            name: room,
                            messages: sameRoom.messages,
                            users: sameRoom.users
                        };
                        
                        dispatch({type: 'update',
                            data: newData
                        })
                    }
                    
                } else { // kick you
                    setRoomEvent({type: 'remove room', data: {room, reason: 'kick'}});
                }
                
            }
        } else if(roomsRef.current.length && type === 'global ban') {
            if(username !== kickedUserName) {
                roomsRef.current.map((roomRef) => {
                 // kick other
                    let kickedUser = roomRef.users.find(({username}) => (username === kickedUserName));
                    if(kickedUser) {
                        roomRef.removeOnlineUser(kickedUser._id);
                        let msg = t('ChatApp.sys_ban_admin_room_all', {username: kickedUserName});
                        let message = {
                            type: 'system',
                            msg
                        }
                        roomRef.addMessages([message]);
                        dispatch({
                            type: 'update',
                            data: {
                                name: roomRef.name,
                                messages: roomRef.messages,
                                users: roomRef.messages
                            }
                        })
                    }
                })
            }
            else { // kick you
                // remove all room
                roomsRef.current = null;
                history.push('/');
                let alertText = t('ChatApp.error_admin_ban_all_room');
                enqueueSnackbar(alertText, {variant: 'error'});
            }
        }
    }

    const removeRoom = React.useCallback(async (room, callback) => {
        console.log('remove room', room, data, roomsData)
        if(status === 'resolved' && roomsStatus === 'resolved') {
            let {name: currentRoomName} = data;
            let roomIndexToRemove = roomsRef.current.findIndex((item) => (item.name === room));
            let newRoomIndex = null;
            if(roomIndexToRemove >= 0) {
                if(room === currentRoomName) {
                    let newRoom = null;
                    if(roomIndex > 0) {
                        newRoom = roomsRef.current[roomIndex - 1];
                        newRoomIndex = roomIndex-1;
                    } else {
                        newRoom = roomsRef.current[1];
                        newRoomIndex = 0;
                    }
                    if(!newRoom) {
                        return history.push('/');
                    }
                    newRoom.mergeUnreadMessages();
                    let data = {};
                    data.name = newRoom.name;
                    data.messages = newRoom.messages;
                    data.users = newRoom.onlineUsers;
                    data.blocks = newRoom.blocks;
                    data.mutes = newRoom.mutes
                    data.unReadMessages = newRoom.unReadMessages;
                    data.users = newRoom.users;
                    dispatch({type: 'init', data});
                }
                let newRooms = await(roomsRef.current.filter((oneRoom) => (oneRoom.name !==room)));
                roomsRef.current = newRooms;
                // console.log('remove a room');
                if(newRoomIndex === null) {
                    newRoomIndex = roomsRef.current.findIndex((item) => (item.name === currentRoomName));
                }
                console.log(newRoomIndex, currentRoomName, room, roomsRef.current)
                let newRoomsData = roomsRef.current.map(({name, unReadMessages}) => ({name, unReadMessages}));
                roomsDispatch({type: 'set', data: newRoomsData, roomIndex: newRoomIndex});
                if(callback) callback(true);
            } else {
                if(callback) callback(false);
            }
        }
        // if(mediaClientRef.current) {
        //     mediaClientRef.current.exitRoom(room);
        // }
    }, [state, roomsState, history])

    const changeMuteState = (roomName, userToMute, isMuted) => {
        let room = roomsRef.current.find((item) => (item.name === roomName));
        if(room) {
            if(isMuted) {
                let newMutes = mutes.filter((item) => (
                    item.room !== roomName ||
                    item.username !== userToMute.username ||
                    (item.ip && userToMute.ip && (item.ip !== userToMute.ip))
                ));
                setMutes(newMutes);
                if(!room.deleteMute(userToMute)) {
                    enqueueSnackbar('This user was blocked', {variant: 'error'});
                }
            } else {
                let localMute = mutes.find((item) => (item.room === roomName
                    && item.username === userToMute.username
                    && item.ip === userToMute.ip))
                if(!localMute) {
                    let newMutes = [...mutes, {room: roomName, username: userToMute.username, ip: userToMute.ip}];
                    setMutes(newMutes);
                }
                // if(!userInfo || (userInfo && !userInfo.blocked)) {
                    room.addMute(userToMute);
                // }
                
            }
            let {name: currentRoomName} = data;
            if(currentRoomName === roomName) {
                dispatch({
                    type: 'update',
                    data: {
                        name: roomName,
                        mutes: room.mutes
                    }
                })
            }
        }
    }

    const receiveMessage = useCallback(({message}) => {
        if(message) {
            if(message.type === 'public') {
                let room = roomsRef.current.find((item) => (item.name === message.room))
                if(room && message.msg) {
                    if(message.msg) {
                        let userToReceive = room.users.find((item) => (item.username === message.from));
                        if(userToReceive && !userToReceive.muted) {
                            publicAudioControls.seek(0);
                            publicAudioControls.play();
                        }
                        if(roomNameRef.current !== room.name) {
                            room.addUnreadMessage(message);
                        } else {
                            room.addMessages([message]);
                        }
                    }
                    
                    if(roomNameRef.current === room.name) {
                        dispatch({
                            type: 'update',
                            data: {
                                name: room.name,
                                messages: room.messages,
                            }
                        })
                    }
                } 
                
            } else if(message.type==='private' && privateListRef.current && message.msg && message.to) {
                if(!privateListRef.current.addMessage(message, message.roomName)) {
                    // addUnReadMsg(newMessage.message);
                }
                // if(newMessage.callback) {
                //     newMessage.callback(true);
                // }
                privateAudioControls.seek(0);
                privateAudioControls.play();
            }
            let infos = roomsRef.current.map(({name, unReadMessages}) => ({name, unReadMessages}));
            roomsDispatch({type: 'set', data: infos});
        }
    }, [data, roomIndex]);

    const receivePoke = (pokeMessage) => {
        let {room} = pokeMessage;
        console.log('poke', pokeMessage)
        if(roomsRef.current && room) {
            let sameRoom = roomsRef.current.find((item) => (item.name === room));
            if(sameRoom) {
                if(pokeMessage.to === username) {
                    let message = {
                        type: 'poke',
                        from: pokeMessage.from,
                        msg: t('PokeMessage.have_poked_you', {username: pokeMessage.from}) 
                    }
                    sameRoom.addMessages([message]);
                    let userToReceive = sameRoom.users.find((item) => (item.username === pokeMessage.from));
                    if(userToReceive && !userToReceive.muted) {
                        pokeAudioControls.seek(0);
                        pokeAudioControls.play()
                    }
                    dispatch({
                        type: 'update',
                        data: {
                            name: room,
                            messages: sameRoom.messages
                        }
                    })
                }
            }
        }
    }

    const addMessage = ({message, room}) => {
        let sameRoom = roomsRef.current.find((item) => (item.name) === room);
        if(sameRoom) {
            sameRoom.addMessages([message]);
            dispatch({
                type: 'update',
                data: {
                    name: room,
                    messages: sameRoom.messages
                }
            })
        }
    }
    useEffect(() => {
        if(socket && mediaSocket && initRoomName && username) {
            let result = socket.open();
            // mediaSocket.open();

            isPrivateRoom(initRoomName, ({isPrivate}) => {
                if(isPrivate) {
                //    setRoomNameForPassword(room);
                //    setOpenPasswordModal(true);
                } else {
                    socket.emit('join room', { room: initRoomName }, (result, message) => {
                        if(!result) {
                            if(message)
                                enqueueSnackbar(t('ChatApp.'+message, {roomName: initRoomName}), {variant: 'error'});
                            dispatch({type: 'rejected', error: 'joine error'});
                        }
                    });
                }
            }, (err) => {
                console.log(err);
            })
            
            socket.on('connect_error', (err) => {
                console.log(err)
            })
            socket.on('init room', async ({room, onlineUsers, messages, blocks, globalBlocks}, fn) => {
                fn('success');
                let usernames = await onlineUsers.map((item) => (item.username));
                if(usernames.includes(username)) {
                    // console.log('username: ', username);
                    initRoom({room, onlineUsers, messages, blocks, globalBlocks});
                }
            });
            socket.on('joined room',async ({room, onlineUsers, joinedUser}) => {
                addUser({room, onlineUsers, joinedUser});
            });
            socket.on('leave room', async ({room, onlineUsers, leavedUser}) => {
                removeUser({room, leavedUser});
            });
            socket.on('kicked user', async ({room, kickedUserName}) => {
                kickUser({room, kickedUserName, type: 'kick'});
            });
            socket.on('banned user', async ({room, kickedUserName}) => {
                kickUser({room, kickedUserName, type: 'ban'}); 
            });
            socket.on('global banned user', async ({kickedUserName}) => {
                kickUser({kickedUserName, type: 'global ban'}); 
            });
            socket.on('update block', ({room, blocks}) => {
                console.log('update blocks', room, blocks)
                dispatch({type: 'update', data: { name: room, blocks}}); 
            })
            socket.on('update global block', ({blocks}) => {
                setGlobalBlocks(blocks);
            })
            socket.on('room message', (message, callback) => {
                if(callback) {
                    callback(true);
                }
                receiveMessage({message});
            });
            socket.on('private message', (message, callback) => {
            })
            socket.on('poke message', payload => {
                receivePoke(payload)
            })

            // socket.on('join error', payload => {
            //    joinErrorHandler(payload);
            // })

            socket.on('hey', (payload, callback) => {
                callback(true);
            })

            socket.on('disconnect', (reason) => {
                setOpenDisconnectModal(true);
                if (reason === 'io server disconnect') {
                    // the disconnection was initiated by the server, you need to reconnect manually
                    socket.connect();
                }
            })

            
            socket.on('connect_error', (err) => {
                console.log('connect_error', err);
            })

            socket.io.on('reconnect', () => {
                let roomNames = roomsRef.current.map((room) => (room.name));
                let privateRooms = privateListRef.current ? privateListRef.current.getPrivateRooms(): [];
                roomNames.map(async (roomName) => {
                    socket.emit('rejoin room',{room: roomName, type: 'public'}, (result, error) => {
                        if(result) {
                            console.log('rejoin success') 
                        } else {
                            console.log('rejoin fail', error)
                        }
                        
                    })
                });
                privateRooms.map((roomName) => {
                    socket.emit('rejoin room',{room: roomName, type: 'private'}, (result) => {
                        if(result) {
                            console.log('rejoin success') 
                        } else {
                            console.log('rejoin fail')
                        }
                        
                    })
                })
                setOpenDisconnectModal(false)
            })

            socket.io.on('reconnect_attempt', () => {
                console.log('reconnect_attempt');
            })
            socket.on('connect', () => {
            })

            socket.on('repeat connection', () => {
                enqueueSnackbar(t('ChatApp.already_in_chat'), {variant: 'error'});
                history.push('/');
            })

            mediaSocket.on('view request', ({username, roomName}, callback) => {
                console.log('get view request')
                // permissionRequest(username, roomName, callback);
            })

            return () => {
                socket.removeAllListeners();
                socket.close();
                mediaSocket.removeAllListeners();
                mediaSocket.close();
            };
        }
    }, [socket, mediaSocket, initRoomName, username]);

    useEffect(() => {
        if(status === 'rejected') {
            history.push('/')
        }
    }, [status])

    useEffect(() => {
        if(roomEvent) {
            let {type, data} = roomEvent;
            console.log(roomEvent, type)
            switch(type) {
                case 'remove room':
                    let {room, reason} = data;
                    console.log(data)
                    removeRoom(room, (result, message) => {
                        if(result) {
                            let alertText = (reason === 'kick') 
                                ?t('ChatApp.kicked_from_owner',{roomName: room})
                                :t('ChatApp.banned_from_admin',{roomName: room});
                            enqueueSnackbar(alertText, {variant: 'error'});
                        } else {
                            console.log(result, message)
                        }
                        
                    })
                    break;
                default:
                    break;
            }
        }
    }, [roomEvent, removeRoom])

    useEffect(() => {

        if(enablePokeSound) {
            pokeAudioControls.unmute();
        } else {
            pokeAudioControls.mute();
        }
    }, [enablePokeSound])
    useEffect(() => {

        if(enablePublicSound) {
            publicAudioControls.unmute();
        } else {
            publicAudioControls.mute();
        }
    }, [enablePublicSound]);
    useEffect(() => {

        if(enablePrivateSound) {
            privateAudioControls.unmute();
        } else {
            privateAudioControls.mute();
        }
    }, [enablePrivateSound])

    return {
        status,
        data,
        error,
        roomsStatus,
        roomsData,
        roomsError,
        roomIndex,
        globalBlocks,
        privateListRef,
        changeRoom,
        removeRoom,
        addRoom,
        addMessage,
        changeMuteState,
        pokeAudio,
        privateAudio,
        publicAudio,
        openDisconnectModal,
        setOpenDisconnectModal
    }

}


export default useRooms;
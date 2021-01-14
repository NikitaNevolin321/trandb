import React from 'react';
import { useParams } from 'react-router-dom';

import RoomsContext from '../../contexts/roomContext';
import { useRooms } from '../../utils';
import { HomeLayout } from '../../components';
// import { makeStyles } from '@material-ui/styles';
import {
    CssBaseline,
} from '@material-ui/core';
import ChatRooms from '../../components/ChatRooms';

// const socket = io({
//   autoConnect: false,
// });

// const useStyles = makeStyles((theme) => ({
//     root: {
//         display: 'flex',
//         flexDirection: 'column',
//         justifyContent: 'space-between',
//         height: '100%',
//         position: 'relative'
//     },
//     messageArea: {
//         flex: 1
//     },
//     inputArea: {
//         borderRadius: '0px',
//         display: 'flex',
//         height: 'fit-content',
//         boxShadow: '1px 1px 20px 14px rgb(0 0 0 / 23%), 0px 1px 1px 0px rgba(0,0,0,0.14)',
//         zIndex: '10',
//     },
//     inputForm: {
//         display: 'flex',
//         flex: 1,
//         justifyContent: 'center',
//         alignItems: 'center',

//     },
//     formActionArea: {
//         display: 'flex',
//         height: '100%',
//         justifyContent: 'center',
//         alignItems: 'flex-end'
//     },
//     formActions: {
//         display: 'flex',
//         justifyContent: 'center',
//         alignItems: 'center'
//     },
//     textArea: {
//         flex: 1,
//         paddingLeft: '20px',
//         paddingRight: '20px',
//         fontSize: '25px',
//     },
//     sendButton: {
//         color: theme.palette.primary.main,
//     },
//     emojiArea: {
//         '& button, span': {
//             outline: 'none'
//         },
//         zIndex: '200'
//     }
// }))



const ChattingRoom = () => {
    const { rooms, setRooms } = useRooms();
    
    const { room } = useParams();
    // const [rooms, setRooms] = useState([]);
    
    // const { username } = useContext(UserContext);
    // const [users, setUsers] = useState(null);
    // const [messages, setMessages] = useState([]);
    // const [msg, setMsg] = useState('');
    // const inputRef = useRef(null);
    // const formRef = useRef(null);
    // const [open, setOpen] = React.useState(false);
    // const anchorRef = React.useRef(null);

    // const handleToggle = () => {
    //     setOpen((prevOpen) => !prevOpen);
    // };
    // const handleClose = (event) => {
    //     if (anchorRef.current && anchorRef.current.contains(event.target)) {
    //     return;
    //     }
    //     setOpen(false);
    // };
    
    // useEffect(() => {
    //     socket.open();
    //     socket.emit('joinRoom', { room });
    //     socket.on('joinRoom', (onlineUsers) => {
    //         setUsers(onlineUsers);
    //     });
    //     socket.on('msg', (newMessage) => {
    //         console.log(newMessage);
    //         setMessages((msgs) => [...msgs, ...newMessage]);
    //     });
    //     return () => {
    //     socket.removeAllListeners();
    //     socket.close();
    //     };
    // }, [room]);

    // useEffect(() => {
    //     if (users && username) {
    //         let usernames = users.map((user) => {
    //             return user.username;
    //         })
    //         if (!usernames.includes(username)) history.push('/rooms');
    //     }
    // }, [users, username, history]);

    // const onFinish = (e) => {
    //     e.preventDefault();
    //     let realMsg = msg.trim();
    //     if (realMsg) {
    //         const date = Date.now();
    //         socket.emit('msg', { msg: realMsg, room, username, date });
    //         setMsg('');
    //     }
    // };

    // const handleKeyDown = (e) => {
    //     if(e.keyCode == 13 && e.shiftKey == false) {
    //         e.preventDefault();
    //         console.log(formRef);
    //         // formRef.current.submit();
    //         onFinish(e);
    //     }
    // }
    // const addEmoji = e => {
    //     let sym = e.unified.split('-');
    //     let codesArray = [];
    //     sym.forEach(el => codesArray.push('0x' + el));
    //     let emoji = String.fromCodePoint(...codesArray);
    //     setMsg(msg + emoji);
    //     handleClose(e);
    //     inputRef.current.firstChild.focus();
    //   }
    
    // if (!users) return <Spin className="chatting__spinner" />;

    // useEffect(() => {
    //     console.log(room);
    //     if(room) {
    //         console.log(rooms)
    //         setRooms([room]);
    //         console.log(rooms)
    //     }
        
    // }, [room])

    return (
        <HomeLayout>
            <CssBaseline />
            {/* { rooms && rooms.length &&
            rooms.map((roomName, index) => (

            
            <ChatRoom room={roomName} key={index}> */}
            {/* <div className={classes.root}>
                <MessagesList messages={messages} users={users} className={classes.messageArea} />
                <div className={classes.inputArea}>
                <form className={classes.inputForm} onSubmit={onFinish} ref={formRef}>
                    <InputBase
                        ref={inputRef}
                        className={classes.textArea}
                        size="large"
                        autoComplete="off"
                        value={msg}
                        onChange={(e) => setMsg(e.target.value)}
                        multiline
                        onKeyDown={handleKeyDown}
                    />
                    <div className={classes.formActionArea}>
                        <div className={classes.formActions}>
                            
                            <IconButton aria-label="send"
                                    className={classes.sendButton}
                                    variant="contained"
                                    type="submit"
                                    disabled={msg.trim()? false: true}
                                >
                                <SendIcon fontSize="large"/>
                            </IconButton>
                            <IconButton 
                                variant="contained"
                                color="primary"
                                ref={anchorRef}
                                onClick={handleToggle}>
                                {String.fromCodePoint(0x1f60a)}
                            </IconButton>
                            <IconButton aria-label="send"
                                variant="contained"
                                color="primary"
                            >
                                <AddIcon fontSize="large"/>
                            </IconButton>
                        </div>
                    </div>
                </form>
                <Popper className={classes.emojiArea}
                    open={open} anchorEl={anchorRef.current} role={undefined} transition>
                {
                    ({ TransitionProps, placement }) => (
                    <Grow
                        {...TransitionProps}
                        style={{ transformOrigin: placement === 'bottom' ? 'center top' : 'center bottom' }}
                    >
                        <ClickAwayListener onClickAway={handleClose}>
                            <Picker onSelect={addEmoji} />
                        </ClickAwayListener>
                    </Grow>
                    )
                }
                </Popper>
                </div>
            </div> */}
            {/* </ChatRoom>
            ))
            } */}
            <ChatRooms room={room}/>
        </HomeLayout>
    );
};

export default ChattingRoom;

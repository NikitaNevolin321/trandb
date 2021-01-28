import React, { useState, useLayoutEffect } from 'react';
import { useHistory } from 'react-router-dom';
import {
    AppBar,
    Toolbar,
    IconButton,
    Badge,
} from "@material-ui/core";
import {
    Mail,
    Settings,
    AccountCircle
} from '@material-ui/icons'
import AppMenu from '../AppMenu';
import { makeStyles } from '@material-ui/core/styles';
import PrivateMails from './PrivateMails';

const useStyles = makeStyles((theme) => ({
    root: {
        flexDirection: 'row',
        display: `flex`,
        justifyContent: `space-between`,
        alignItems: 'center',
        backgroundColor: theme.palette.primary.main,
        flexWrap: 'wrap',
        minHeight: '50px'
    },
    title: {
        flexGrow: 1,
        minHeight: '50px'
    },
    logo : {
        cursor: 'pointer',
        [theme.breakpoints.down('xs')]: {
            display: 'none',
        },
    },
    grow: {
        flexGrow: 1,
        padding: '0px 10px',
        display: 'flex',
        alignItems: 'center',
        borderRadius: 5,
        overflow: 'hidden'

    },
    sectionDesktop: {
        display: 'flex',
        [theme.breakpoints.up('sm')]: {
          display: 'flex',
        },
      },
      sectionMobile: {
        display: 'flex',
        [theme.breakpoints.up('sm')]: {
          display: 'none',
        },
    },
}));
const HomeLayout = ({children, unReadMsgs, openPrivate}) => {
    const classes = useStyles();
    const history = useHistory();
    const [frameShow, setFrameShow] = useState(false);

    useLayoutEffect(() => {
        setFrameShow(true)
    }, [])
    
    return (
    <div>
        <AppBar position="static" className={classes.root}>
            <Toolbar  className={classes.title}>
                <img
                    src="/img/logo.png"
                    alt="logo"
                    className={classes.logo}
                    onClick={()=>history.push('/')}
                />
                <div className={classes.grow} >{ frameShow ?
                    <iframe src="https://widget.walla.co.il/fxp4" height="40px" width="100%" frameborder={0} scrolling="no" />
                    :<span />
                }
                </div>
                <div className={classes.sectionDesktop}>
                    <IconButton aria-label="show 17 new notifications" color="inherit">
                        <Settings />
                    </IconButton>
                    {/* <PrivateMails unReadMsgs={unReadMsgs} openPrivate={openPrivate} /> */}
                    {/* <IconButton aria-label="show 4 new mails" color="inherit">
                        <Badge badgeContent={unReadMsgs.length} color="secondary">
                            <Mail />
                        </Badge>
                    </IconButton> */}
                </div>
                <AppMenu />
            </Toolbar>
            
        </AppBar>
        {children}
    </div>
    )
}

export default HomeLayout;
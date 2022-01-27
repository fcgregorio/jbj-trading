import MoreVertIcon from '@mui/icons-material/MoreVert';
import { IconButton, ListItemButton, Menu, MenuItem, Tooltip } from '@mui/material';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import Drawer from '@mui/material/Drawer';
import List from '@mui/material/List';
import ListItemText from '@mui/material/ListItemText';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import * as React from 'react';
import {
    Outlet,
    useLocation, 
    useNavigate,
    Link as RouterLink,
} from "react-router-dom";
import { AuthContext } from '../Context';

const drawerWidth = 240;

export default function Index() {
    const navigate = useNavigate();
    const location = useLocation();

    const [authContext, setAuthContext] = React.useContext(AuthContext);

    const [showUsernameTooltip, setShowUsernameTooltip] = React.useState(false);

    React.useEffect(() => {
        if (authContext === null) {
            navigate('/login', { replace: true });
        }
    }, [navigate, authContext]);

    const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
    const open = Boolean(anchorEl);
    const handleClickOverflow = (event: React.MouseEvent<HTMLElement>) => {
        setAnchorEl(event.currentTarget);
    };
    const handleClose = () => {
        setAnchorEl(null);
    };

    function handleLogout() {
        setAuthContext(null);
    }

    function handleClick(url: string) {
        navigate(url);
    }

    const usernameElRef = React.useRef<HTMLSpanElement>(null);
    React.useEffect(() => {
        if (usernameElRef.current === null) {
            setShowUsernameTooltip(false);
        } else {
            setShowUsernameTooltip(usernameElRef.current.offsetWidth < usernameElRef.current.scrollWidth);
        }
    }, [usernameElRef]);

    return (
        <Box sx={{ display: 'flex' }}>
            <AppBar
                position="fixed"
                sx={{ width: `calc(100% - ${drawerWidth}px)`, ml: `${drawerWidth}px` }}
            >
                <Toolbar variant="dense">
                    {/* <Typography variant="h6" noWrap component="div">
                                        Olbes
                                    </Typography> */}
                </Toolbar>
            </AppBar>
            <Drawer
                variant="permanent"
                sx={{
                    width: drawerWidth,
                    flexShrink: 0,
                    [`& .MuiDrawer-paper`]: { width: drawerWidth, boxSizing: 'border-box' },
                }}
            >
                <Box
                    sx={{ overflow: 'auto' }}
                >
                    <Toolbar variant="dense">
                        {authContext &&
                            <React.Fragment>
                                <Tooltip
                                    title={showUsernameTooltip ? authContext.user.username : ''}
                                    placement="bottom-start"
                                >
                                    <Typography
                                        ref={usernameElRef}
                                        noWrap
                                        variant="body2"
                                    >
                                        {authContext.user.username}
                                    </Typography>
                                </Tooltip>

                                <Box
                                    sx={{
                                        marginLeft: 'auto',
                                    }}
                                >
                                    <IconButton
                                        id="user-overflow-button"
                                        aria-controls="user-overflow-menu"
                                        aria-haspopup="true"
                                        aria-expanded={open ? 'true' : undefined}
                                        onClick={handleClickOverflow}
                                    >
                                        <MoreVertIcon />
                                    </IconButton>
                                    <Menu
                                        id="user-overflow-menu"
                                        aria-labelledby="user-overflow-button"
                                        anchorEl={anchorEl}
                                        open={open}
                                        onClose={handleClose}
                                        anchorOrigin={{
                                            vertical: 'top',
                                            horizontal: 'left',
                                        }}
                                        transformOrigin={{
                                            vertical: 'top',
                                            horizontal: 'left',
                                        }}
                                    >
                                        <MenuItem onClick={() => { handleLogout(); handleClose(); }}>Logout</MenuItem>
                                    </Menu>
                                </Box>
                            </React.Fragment>
                        }
                    </Toolbar>
                    <Divider />
                    <List
                        sx={{
                            '&& .Mui-selected': {
                                bgcolor: '#eeeeee',
                            },
                        }}
                    >
                        {/* <ListItemButton
                                            selected={location.pathname === '/'}
                                            key={'Dashboard'}
                                            component="a"
                                            href="/"
                                            onClick={(event: React.MouseEvent<HTMLAnchorElement>) => {
                                                event.preventDefault();
                                                handleClick('/');
                                            }}
                                        >
                                            <ListItemIcon>
                                                <DashboardIcon />
                                            </ListItemIcon>
                                            <ListItemText
                                                primary={'Dashboard'}
                                            />
                                        </ListItemButton>
                                        <Divider /> */}
                        <ListItemButton
                            selected={location.pathname === '/transactions'}
                            key={'Transactions'}
                            component="a"
                            href="/transactions"
                            onClick={(event: React.MouseEvent<HTMLAnchorElement>) => {
                                event.preventDefault();
                                handleClick('/transactions');
                            }}
                        >
                            <ListItemText
                                primary={'Transactions'}
                            />
                        </ListItemButton>
                        <ListItemButton
                            selected={location.pathname === '/in-transactions'}
                            key={'In-Transactions'}
                            component="a"
                            href="/in-transactions"
                            onClick={(event: React.MouseEvent<HTMLAnchorElement>) => {
                                event.preventDefault();
                                handleClick('/in-transactions');
                            }}
                            sx={{ pl: 4 }}
                        >
                            <ListItemText
                                primary={'In-Transactions'}
                            />
                        </ListItemButton>
                        <ListItemButton
                            selected={location.pathname === '/out-transactions'}
                            key={'Out-Transactions'}
                            component="a"
                            href="/out-transactions"
                            onClick={(event: React.MouseEvent<HTMLAnchorElement>) => {
                                event.preventDefault();
                                handleClick('/out-transactions');
                            }}
                            sx={{ pl: 4 }}
                        >
                            <ListItemText
                                primary={'Out-Transactions'}
                            />
                        </ListItemButton>
                        <Divider />
                        <ListItemButton
                            selected={location.pathname === '/transfers'}
                            key={'Transfers'}
                            component="a"
                            href="/transfers"
                            onClick={(event: React.MouseEvent<HTMLAnchorElement>) => {
                                event.preventDefault();
                                handleClick('/transfers');
                            }}
                        >
                            <ListItemText
                                primary={'Transfers'}
                            />
                        </ListItemButton>
                        <ListItemButton
                            selected={location.pathname === '/in-transfers'}
                            key={'In-Transfers'}
                            component="a"
                            href="/in-transfers"
                            onClick={(event: React.MouseEvent<HTMLAnchorElement>) => {
                                event.preventDefault();
                                handleClick('/in-transfers');
                            }}
                            sx={{ pl: 4 }}
                        >
                            <ListItemText
                                primary={'In-Transfers'}
                            />
                        </ListItemButton>
                        <ListItemButton
                            selected={location.pathname === '/out-transfers'}
                            key={'Out-Transfers'}
                            component="a"
                            href="/out-transfers"
                            onClick={(event: React.MouseEvent<HTMLAnchorElement>) => {
                                event.preventDefault();
                                handleClick('/out-transfers');
                            }}
                            sx={{ pl: 4 }}
                        >
                            <ListItemText
                                primary={'Out-Transfers'}
                            />
                        </ListItemButton>
                        <Divider />
                        <ListItemButton
                            selected={location.pathname === '/items'}
                            key={'Items'}
                            component="a"
                            href="/items"
                            onClick={(event: React.MouseEvent<HTMLAnchorElement>) => {
                                event.preventDefault();
                                handleClick('/items');
                            }}
                        >
                            <ListItemText
                                primary={'Items'}
                            />
                        </ListItemButton>
                        <ListItemButton
                            selected={location.pathname === '/units'}
                            key={'Units'}
                            component="a"
                            href="/units"
                            onClick={(event: React.MouseEvent<HTMLAnchorElement>) => {
                                event.preventDefault();
                                handleClick('/units');
                            }}
                        >
                            <ListItemText
                                primary={'Units'}
                            />
                        </ListItemButton>
                        <ListItemButton
                            selected={location.pathname === '/categories'}
                            key={'Categories'}
                            component="a"
                            href='/categories'
                            onClick={(event: React.MouseEvent<HTMLAnchorElement>) => {
                                event.preventDefault();
                                handleClick('/categories');
                            }}
                        >
                            <ListItemText
                                primary={'Categories'}
                            />
                        </ListItemButton>
                        {
                            authContext?.user.admin &&
                            <React.Fragment>
                                <Divider />
                                <ListItemButton
                                    selected={location.pathname === '/users'}
                                    key={'Users'}
                                    component="a"
                                    href="/users"
                                    onClick={(event: React.MouseEvent<HTMLAnchorElement>) => {
                                        event.preventDefault();
                                        handleClick('/users');
                                    }}
                                >
                                    <ListItemText
                                        primary={'Users'}
                                    />
                                </ListItemButton>
                            </React.Fragment>
                        }
                    </List>
                </Box>
            </Drawer>
            <Box component="main" sx={{ flexGrow: 1 }} p={0}>
                <Toolbar variant="dense" />
                <Outlet />
            </Box>
        </Box >
    );
};

import { MoreVert as MoreVertIcon } from "@mui/icons-material";
import {
  Box,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemText,
  Menu,
  MenuItem,
  Toolbar,
  Tooltip,
  Typography,
} from "@mui/material";
import * as React from "react";
import { matchPath, Outlet, useLocation, useNavigate } from "react-router-dom";
import { AuthContext } from "../Context";

const drawerWidth = 240;

export default function Index() {
  const navigate = useNavigate();
  const location = useLocation();

  const [authContext, setAuthContext] = React.useContext(AuthContext);

  const [showUsernameTooltip, setShowUsernameTooltip] = React.useState(false);

  React.useEffect(() => {
    if (authContext === null) {
      navigate("/login", { replace: true });
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
      setShowUsernameTooltip(
        usernameElRef.current.offsetWidth < usernameElRef.current.scrollWidth
      );
    }
  }, [usernameElRef]);

  return (
    <Box
      sx={{
        display: "flex",
      }}
    >
      <Drawer
        variant="permanent"
        sx={{
          width: drawerWidth,
          flex: "0 0 auto",
          "& .MuiDrawer-paper": {
            width: drawerWidth,
            boxSizing: "border-box",
          },
        }}
      >
        <Box>
          <Toolbar variant="dense">
            {authContext && (
              <React.Fragment>
                <Tooltip
                  title={showUsernameTooltip ? authContext.user.username : ""}
                  placement="bottom-start"
                >
                  <Typography ref={usernameElRef} noWrap variant="body2">
                    {authContext.user.username}
                  </Typography>
                </Tooltip>

                <Box
                  sx={{
                    marginLeft: "auto",
                  }}
                >
                  <IconButton
                    id="user-overflow-button"
                    aria-controls="user-overflow-menu"
                    aria-haspopup="true"
                    aria-expanded={open ? "true" : undefined}
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
                      vertical: "top",
                      horizontal: "left",
                    }}
                    transformOrigin={{
                      vertical: "top",
                      horizontal: "left",
                    }}
                  >
                    <MenuItem
                      onClick={() => {
                        handleLogout();
                        handleClose();
                      }}
                    >
                      Logout
                    </MenuItem>
                  </Menu>
                </Box>
              </React.Fragment>
            )}
          </Toolbar>
          <Divider />
          <List
            sx={{
              "&& .Mui-selected": {
                bgcolor: "#eeeeee",
              },
            }}
          >
            {authContext?.user.admin && (
              <React.Fragment>
                <ListItemButton
                  selected={
                    matchPath("/dashboard/*", location.pathname) !== null
                  }
                  key={"Dashboard"}
                  component="a"
                  href="/dashboard"
                  onClick={(event: React.MouseEvent<HTMLAnchorElement>) => {
                    event.preventDefault();
                    handleClick("/dashboard");
                  }}
                >
                  <ListItemText primary={"Dashboard"} />
                </ListItemButton>
                <Divider />
              </React.Fragment>
            )}
            <ListItemButton
              selected={
                matchPath("/transactions/*", location.pathname) !== null
              }
              key={"Transactions"}
              component="a"
              href="/transactions"
              onClick={(event: React.MouseEvent<HTMLAnchorElement>) => {
                event.preventDefault();
                handleClick("/transactions");
              }}
            >
              <ListItemText primary={"Transactions"} />
            </ListItemButton>
            <ListItemButton
              selected={
                matchPath("/in-transactions/*", location.pathname) !== null
              }
              key={"In-Transactions"}
              component="a"
              href="/in-transactions"
              onClick={(event: React.MouseEvent<HTMLAnchorElement>) => {
                event.preventDefault();
                handleClick("/in-transactions");
              }}
              sx={{ pl: 4 }}
            >
              <ListItemText primary={"In-Transactions"} />
            </ListItemButton>
            <ListItemButton
              selected={
                matchPath("/out-transactions/*", location.pathname) !== null
              }
              key={"Out-Transactions"}
              component="a"
              href="/out-transactions"
              onClick={(event: React.MouseEvent<HTMLAnchorElement>) => {
                event.preventDefault();
                handleClick("/out-transactions");
              }}
              sx={{ pl: 4 }}
            >
              <ListItemText primary={"Out-Transactions"} />
            </ListItemButton>
            <Divider />
            <ListItemButton
              selected={matchPath("/transfers/*", location.pathname) !== null}
              key={"Transfers"}
              component="a"
              href="/transfers"
              onClick={(event: React.MouseEvent<HTMLAnchorElement>) => {
                event.preventDefault();
                handleClick("/transfers");
              }}
            >
              <ListItemText primary={"Transfers"} />
            </ListItemButton>
            <ListItemButton
              selected={
                matchPath("/in-transfers/*", location.pathname) !== null
              }
              key={"In-Transfers"}
              component="a"
              href="/in-transfers"
              onClick={(event: React.MouseEvent<HTMLAnchorElement>) => {
                event.preventDefault();
                handleClick("/in-transfers");
              }}
              sx={{ pl: 4 }}
            >
              <ListItemText primary={"In-Transfers"} />
            </ListItemButton>
            <ListItemButton
              selected={
                matchPath("/out-transfers/*", location.pathname) !== null
              }
              key={"Out-Transfers"}
              component="a"
              href="/out-transfers"
              onClick={(event: React.MouseEvent<HTMLAnchorElement>) => {
                event.preventDefault();
                handleClick("/out-transfers");
              }}
              sx={{ pl: 4 }}
            >
              <ListItemText primary={"Out-Transfers"} />
            </ListItemButton>
            <Divider />
            <ListItemButton
              selected={matchPath("/items/*", location.pathname) !== null}
              key={"Items"}
              component="a"
              href="/items"
              onClick={(event: React.MouseEvent<HTMLAnchorElement>) => {
                event.preventDefault();
                handleClick("/items");
              }}
            >
              <ListItemText primary={"Items"} />
            </ListItemButton>
            <ListItemButton
              selected={matchPath("/units/*", location.pathname) !== null}
              key={"Units"}
              component="a"
              href="/units"
              onClick={(event: React.MouseEvent<HTMLAnchorElement>) => {
                event.preventDefault();
                handleClick("/units");
              }}
            >
              <ListItemText primary={"Units"} />
            </ListItemButton>
            <ListItemButton
              selected={matchPath("/categories/*", location.pathname) !== null}
              key={"Categories"}
              component="a"
              href="/categories"
              onClick={(event: React.MouseEvent<HTMLAnchorElement>) => {
                event.preventDefault();
                handleClick("/categories");
              }}
            >
              <ListItemText primary={"Categories"} />
            </ListItemButton>
            {authContext?.user.admin && (
              <React.Fragment>
                <Divider />
                <ListItemButton
                  selected={matchPath("/users/*", location.pathname) !== null}
                  key={"Users"}
                  component="a"
                  href="/users"
                  onClick={(event: React.MouseEvent<HTMLAnchorElement>) => {
                    event.preventDefault();
                    handleClick("/users");
                  }}
                >
                  <ListItemText primary={"Users"} />
                </ListItemButton>
              </React.Fragment>
            )}
          </List>
        </Box>
      </Drawer>
      <Box
        component="main"
        sx={{
          display: "flex",
          flex: "1 1 auto",
          height: "100vh",
        }}
        p={0}
      >
        <Outlet />
      </Box>
    </Box>
  );
}

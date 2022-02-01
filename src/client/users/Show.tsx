import EditIcon from '@mui/icons-material/Edit';
import PasswordIcon from '@mui/icons-material/Password';
import DateTimePicker from '@mui/lab/DateTimePicker';
import { Breadcrumbs, Divider, FormControlLabel, FormGroup, LinearProgress, Link, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Tooltip, Typography } from '@mui/material';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Box from '@mui/system/Box';
import axios, { CancelTokenSource } from 'axios';
import * as React from 'react';
import {
    useNavigate,
    useLocation,
    useParams,
    Link as RouterLink,
} from "react-router-dom";
import { AuthContext } from '../Context';
import { Android12Switch } from '../Switch';
import { DeleteDialogButton } from '../DeleteDialogButton';
import { DateTime } from 'luxon';
import { RestoreDialogButton } from '../RestoreDialogButton';
import { User, UserHistory } from './Users';
import { useSnackbar } from 'notistack';
import { useAsyncEffect } from 'use-async-effect';

function History() {
    const location = useLocation();
    const navigate = useNavigate();
    const params = useParams();
    const { enqueueSnackbar, closeSnackbar } = useSnackbar();

    const [loading, setLoading] = React.useState(false);
    const [cursor, setCursor] = React.useState<number | null>(null);
    const cancelTokenSourceRef = React.useRef<CancelTokenSource | null>(null);
    const [count, setCount] = React.useState<number | null>(null);
    const [userHistories, setUserHistories] = React.useState<UserHistory[]>([]);

    useAsyncEffect(async isActive => {
        setLoading(true);
        await axios.get<
            { count: number; results: UserHistory[]; }
        >(
            `/api${location.pathname}/histories`)
            .then(result => result.data)
            .then(data => {
                setCount(data.count);
                setUserHistories(data.results);
                if (data.results.length === data.count) {
                    setCursor(null);
                } else if (data.results.length !== 0) {
                    setCursor(data.results[data.results.length - 1].historyId);
                } else {
                    setCursor(null);
                }
            })
            .catch(error => {
                enqueueSnackbar('Error loading data', { variant: 'error' });
            })
            .finally(() => {
                setLoading(false);
            });
    }, [location.pathname]);

    async function handleLoadMoreClick() {
        setLoading(true);
        const source = axios.CancelToken.source();
        cancelTokenSourceRef.current = source;
        await axios.get<
            { count: number; results: UserHistory[]; }
        >(
            `/api${location.pathname}/histories`,
            {
                params: {
                    cursor: cursor,
                },
                cancelToken: source.token,
            },
        )
            .then(result => result.data)
            .then(data => {
                setCount(data.count);
                const newItemHistories = [...userHistories, ...data.results];
                setUserHistories(newItemHistories);
                if (newItemHistories.length === data.count) {
                    setCursor(null);
                } else if (data.results.length !== 0) {
                    setCursor(data.results[data.results.length - 1].historyId);
                } else {
                    setCursor(null);
                }
            })
            .catch(error => {
                enqueueSnackbar('Error loading data', { variant: 'error' });
            })
            .finally(() => {
                setLoading(false);
            });
    }

    return (
        <TableContainer
            sx={{
                flex: '1 1 auto',
                overflowY: 'scroll',
                minHeight: '360px',
            }}
        >
            <Table
                size="small"
                stickyHeader
            >
                <TableHead>
                    <TableRow>
                        <TableCell>History ID</TableCell>
                        <TableCell>History User</TableCell>
                        <TableCell>Username</TableCell>
                        <TableCell>Password</TableCell>
                        <TableCell>First Name</TableCell>
                        <TableCell>Last Name</TableCell>
                        <TableCell align="right">Admin</TableCell>
                        <TableCell align="right">Created At</TableCell>
                        <TableCell align="right">Updated At</TableCell>
                        <TableCell align="right">Deleted At</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {count !== null &&
                        <TableRow>
                            <TableCell
                                colSpan={10}
                                align='right'
                                sx={{ background: 'rgba(0, 0, 0, 0.06)' }}
                            >
                                <Typography
                                    fontFamily='monospace'
                                    variant='overline'
                                >
                                    {count} {count === 1 ? 'item' : 'items'}
                                </Typography>
                            </TableCell>
                        </TableRow>
                    }
                    {userHistories.map((row: any) => (
                        <TableRow
                            key={row.id}
                            sx={{
                                '&:last-child td, &:last-child th': { border: 0 },
                            }}
                        >
                            <TableCell>
                                <Typography
                                    fontFamily='monospace'
                                    variant='body2'
                                >
                                    {row.historyId}
                                </Typography>
                            </TableCell>
                            <TableCell>
                                <Tooltip title={row.historyUser} placement="right">
                                    <Link
                                        underline="none"
                                        component={RouterLink}
                                        to={`/users/${row.historyUser}`}
                                        color={'text.primary'}
                                    >
                                        <Typography
                                            fontFamily='monospace'
                                            variant='body2'
                                        >
                                            {row.historyUser.substring(0, 8)}
                                        </Typography>
                                    </Link>
                                </Tooltip>
                            </TableCell>
                            <TableCell>{row.username}</TableCell>
                            <TableCell>{row.password.substring(0, 8) + '...$' + row.password.substring(37, 37 + 8) + '...'}</TableCell>
                            <TableCell>{row.firstName}</TableCell>
                            <TableCell>{row.lastName}</TableCell>
                            <TableCell align="right">
                                <Typography
                                    fontFamily='monospace'
                                    variant='body2'
                                >
                                    {row.admin.toString()}
                                </Typography>
                            </TableCell>
                            <TableCell align="right">{DateTime.fromISO(row.createdAt).toLocal().toLocaleString(DateTime.DATETIME_SHORT)}</TableCell>
                            <TableCell align="right">{DateTime.fromISO(row.updatedAt).toLocal().toLocaleString(DateTime.DATETIME_SHORT)}</TableCell>
                            <TableCell align="right">{row.deletedAt !== null ? DateTime.fromISO(row.deletedAt).toLocal().toLocaleString(DateTime.DATETIME_SHORT) : null}</TableCell>
                        </TableRow>
                    ))}
                    {loading || (cursor &&
                        <TableRow
                            onClick={() => { handleLoadMoreClick(); }}
                            sx={{ cursor: 'pointer' }}
                        >
                            <TableCell
                                colSpan={10}
                                align='center'
                                sx={{ background: 'rgba(0, 0, 0, 0.06)' }}
                            >
                                <Typography
                                    variant='button'
                                >
                                    Load More
                                </Typography>
                            </TableCell>
                        </TableRow>
                    )}
                    {loading &&
                        <TableRow>
                            <TableCell colSpan={10} padding='none'>
                                <LinearProgress />
                            </TableCell>
                        </TableRow>
                    }
                </TableBody>
            </Table>
        </TableContainer>
    );
}

export default function Show() {
    const navigate = useNavigate();
    const location = useLocation();
    const params = useParams();
    const { enqueueSnackbar, closeSnackbar } = useSnackbar();

    const [authContext,] = React.useContext(AuthContext);

    const [loading, setLoading] = React.useState(false);
    const [user, setUser] = React.useState<User | null>(null);

    useAsyncEffect(async isActive => {
        setLoading(true);
        await axios.get<User>(`/api${location.pathname}`)
            .then(result => result.data)
            .then(data => {
                setUser(data);
            })
            .catch(error => {
                enqueueSnackbar('Error loading data', { variant: 'error' });
            })
            .finally(() => {
                setLoading(false);
            });
    }, [location.pathname]);

    async function handleDestroyUser() {
        await axios.delete(`/api${location.pathname}`)
            .then(result => result.data)
            .then(result => {
                navigate('/', { replace: true });
                navigate(`../${params.userID}`, { replace: true });
                enqueueSnackbar('Destroy user successful', { variant: 'success' });
            })
            .catch(error => {
                enqueueSnackbar('Destroy user failed', { variant: 'error' });
            });
    }

    async function handleRestoreUser() {
        await axios.put(`/api${location.pathname}/restore`)
            .then(result => result.data)
            .then(result => {
                navigate('/', { replace: true });
                navigate(`../${params.userID}`, { replace: true });
                enqueueSnackbar('Restore user successful', { variant: 'success' });
            })
            .catch(error => {
                enqueueSnackbar('Restore user failed', { variant: 'error' });
            });
    }


    return (
        <Stack
            sx={{
                boxSizing: 'border-box',
                flex: '1 1 auto',
            }}
        >
            {loading ?
                <LinearProgress />
                :
                <React.Fragment>
                    <Box
                        sx={{
                            display: 'flex',
                            padding: 2,
                        }}
                    >
                        <Stack
                            direction="row"
                            spacing={2}
                            sx={{ marginRight: 'auto' }}
                        >
                            <Box sx={{ marginTop: 'auto' }}>
                                <Breadcrumbs>
                                    <Link
                                        underline="hover"
                                        color="inherit"
                                        component={RouterLink}
                                        to='..'
                                    >
                                        Users
                                    </Link>
                                    <Typography
                                        color="text.primary"
                                    >
                                        {params.userID}
                                    </Typography>
                                </Breadcrumbs>
                            </Box>
                        </Stack>
                        {
                            user !== null &&
                            <Stack
                                direction="row"
                                spacing={2}
                                sx={{ marginLeft: 'auto' }}
                            >
                                {
                                    authContext?.user.admin &&
                                    (user.deletedAt === null ? (
                                        <React.Fragment>
                                            <DeleteDialogButton
                                                handleDelete={handleDestroyUser}
                                            />
                                            <Button
                                                startIcon={<EditIcon />}
                                                variant="contained"
                                                component={RouterLink}
                                                to={`edit`}
                                            >
                                                Edit
                                            </Button>
                                            <Button
                                                startIcon={<PasswordIcon />}
                                                variant="contained"
                                                component={RouterLink}
                                                to={`change-password`}
                                            >
                                                Change Password
                                            </Button>
                                        </React.Fragment>
                                    ) : (
                                        <RestoreDialogButton
                                            handleRestore={handleRestoreUser}
                                        />
                                    ))
                                }
                            </Stack>
                        }
                    </Box>
                    {
                        user !== null &&
                        <React.Fragment>
                            <Stack
                                spacing={2}
                                sx={{
                                    paddingX: 2,
                                }}
                            >
                                <TextField
                                    margin="dense"
                                    id="username"
                                    label="Username"
                                    type="text"
                                    fullWidth
                                    variant="filled"
                                    value={user.username}
                                    InputProps={{
                                        readOnly: true,
                                    }}
                                />
                                <TextField
                                    margin="dense"
                                    id="firstName"
                                    label="First Name"
                                    type="text"
                                    fullWidth
                                    variant="filled"
                                    value={user.firstName}
                                    InputProps={{
                                        readOnly: true,
                                    }}
                                />
                                <TextField
                                    margin="dense"
                                    id="lastName"
                                    label="Last Name"
                                    type="text"
                                    fullWidth
                                    variant="filled"
                                    value={user.lastName}
                                    InputProps={{
                                        readOnly: true,
                                    }}
                                />
                                <FormGroup>
                                    <FormControlLabel
                                        label="Admin"
                                        sx={{
                                            userSelect: 'none',
                                        }}
                                        control={
                                            <Android12Switch
                                                id="admin"
                                                disabled={true}
                                                checked={user.admin}
                                            />
                                        }
                                    />
                                </FormGroup>
                                <DateTimePicker
                                    label="Created At"
                                    value={user.createdAt}
                                    onChange={() => { }}
                                    readOnly={true}
                                    renderInput={(params) =>
                                        <TextField
                                            {...params}
                                            fullWidth
                                            variant="filled"
                                        />
                                    }
                                />
                                <DateTimePicker
                                    label="Updated At"
                                    value={user.updatedAt}
                                    onChange={() => { }}
                                    readOnly={true}
                                    renderInput={(params) =>
                                        <TextField
                                            {...params}
                                            fullWidth
                                            variant="filled"
                                        />
                                    }
                                />
                                <DateTimePicker
                                    label="Deleted At"
                                    value={user.deletedAt}
                                    onChange={() => { }}
                                    readOnly={true}
                                    renderInput={(params) =>
                                        <TextField
                                            {...params}
                                            fullWidth
                                            variant="filled"
                                        />
                                    }
                                />
                            </Stack>
                            {
                                authContext?.user.admin &&
                                <React.Fragment>
                                    <Divider
                                        sx={{
                                            marginTop: 2,
                                        }}
                                    />
                                    <History />
                                </React.Fragment>
                            }
                        </React.Fragment>
                    }
                </React.Fragment>
            }
        </Stack >
    );
};
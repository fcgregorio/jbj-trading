import {
    Add as AddIcon,
    Search as SearchIcon
} from '@mui/icons-material';
import {
    Box,
    Button,
    Divider,
    FormControlLabel,
    FormGroup,
    InputAdornment,
    LinearProgress,
    Link,
    Stack,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TextField,
    Tooltip,
    Typography
} from '@mui/material';
import axios, {
    AxiosResponse,
    CancelToken,
    CancelTokenSource
} from 'axios';
import {
    debounce
} from 'lodash';
import {
    DateTime
} from 'luxon';
import * as React from 'react';
import {
    useNavigate,
    useLocation,
    Link as RouterLink,
    resolvePath,
} from "react-router-dom";
import { AuthContext } from '../Context';
import { FilterMenu } from '../FilterMenu';
import { Android12Switch } from '../Switch';
import {
    User
} from './Users';
import { useSnackbar } from 'notistack';

export default function Index() {
    const navigate = useNavigate();
    const location = useLocation();
    const { enqueueSnackbar, closeSnackbar } = useSnackbar();

    const [authContext,] = React.useContext(AuthContext);

    const [search, setSearch] = React.useState<string>('');
    const [filterMenuShowDeleted, setFilterMenuShowDeleted] = React.useState<boolean>(false);
    const [cursor, setCursor] = React.useState<string | null>(null);

    const [loading, setLoading] = React.useState(false);
    const cancelTokenSourceRef = React.useRef<CancelTokenSource | null>(null);

    const [count, setCount] = React.useState<number | null>(null);
    const [users, setUsers] = React.useState<User[]>([]);

    const queryUsers = React.useMemo(
        () =>
            debounce(
                async (
                    request: {
                        search: string;
                        filters: {
                            showDeleted: boolean;
                        },
                    },
                    startCallback: () => void,
                    callback: (results: { count: number; results: User[]; }) => void,
                    errorCallback: () => void,
                    finallyCallback: () => void,
                    cancelToken: CancelToken,
                ) => {
                    startCallback();
                    await axios.get<
                        { count: number; results: User[]; }
                    >(
                        `/api${location.pathname}`,
                        {
                            params: request,
                            cancelToken: cancelToken,
                        })
                        .then(result => result.data)
                        .then(data => {
                            callback(data);
                        })
                        .catch(error => {
                            if (axios.isCancel(error)) return;
                            errorCallback();
                        })
                        .finally(() => {
                            finallyCallback();
                        });
                },
                200,
            ),
        [location.pathname],
    );

    React.useEffect(() => {
        if (cancelTokenSourceRef.current !== null) {
            cancelTokenSourceRef.current.cancel();
            cancelTokenSourceRef.current = null;
        }

        const cancelTokenSource = axios.CancelToken.source();
        queryUsers(
            {
                search: search,
                filters: {
                    showDeleted: filterMenuShowDeleted,
                },
            },
            () => {
                setCount(null);
                setUsers([]);
                setLoading(true);
            },
            data => {
                setCount(data.count);
                setUsers(data.results);
                if (data.results.length === data.count) {
                    setCursor(null);
                } else if (data.results.length !== 0) {
                    setCursor(data.results[data.results.length - 1].id);
                } else {
                    setCursor(null);
                }
                setLoading(false);
            },
            () => {
                enqueueSnackbar('Error loading data', { variant: 'error' });
            },
            () => {
                setLoading(false);
            },
            cancelTokenSource.token);

        return () => {
            cancelTokenSource.cancel();
        };
    }, [queryUsers, search, filterMenuShowDeleted]);

    async function handleLoadMoreClick() {
        setLoading(true);
        const source = axios.CancelToken.source();
        cancelTokenSourceRef.current = source;
        await axios.get<
            { count: number; results: User[]; }
        >(
            `/api${location.pathname}`,
            {
                params: {
                    search: search,
                    filters: {
                        showDeleted: filterMenuShowDeleted,
                    },
                    cursor: cursor,
                },
                cancelToken: source.token,
            })
            .then(result => result.data)
            .then(data => {
                setCount(data.count);
                const newUsers = [...users, ...data.results];
                setUsers(newUsers);
                if (newUsers.length === data.count) {
                    setCursor(null);
                } else if (data.results.length !== 0) {
                    setCursor(data.results[data.results.length - 1].id);
                } else {
                    setCursor(null);
                }
            })
            .catch(error => {
                if (axios.isCancel(error)) return;
                enqueueSnackbar('Error loading data', { variant: 'error' });
            })
            .finally(() => {
                setLoading(false);
            });
    }

    return (
        <Stack
            sx={{
                boxSizing: 'border-box',
                flex: '1 1 auto',
            }}
        >
            <Box
                sx={{
                    display: 'flex',
                    padding: 2,
                }}
            >
                <Stack direction="row" spacing={2}>
                    <TextField
                        sx={{ width: 250 }}
                        size="small"
                        label="Search"
                        value={search}
                        onChange={(event) => { setSearch(event.target.value); }}
                        InputProps={{
                            type: 'search',
                            startAdornment: (
                                <InputAdornment position="start">
                                    <SearchIcon />
                                </InputAdornment>
                            ),
                        }}
                    />
                    {
                        authContext?.user.admin &&
                        <FilterMenu
                            highlighted={Boolean(filterMenuShowDeleted)}
                        >
                            <Stack
                                spacing={2}
                                sx={{
                                    paddingX: 2,
                                    paddingY: 2,
                                }}
                            >
                                <Typography
                                    sx={{
                                        flex: '1 1 auto',
                                        userSelect: 'none',
                                    }}
                                    variant="subtitle1"
                                    component="div"
                                >
                                    Filters
                                </Typography>
                                <Divider />
                                <FormGroup>
                                    <FormControlLabel
                                        label="Show Deleted"
                                        sx={{
                                            userSelect: 'none',
                                        }}
                                        control={
                                            <Android12Switch
                                                checked={filterMenuShowDeleted}
                                                onChange={(event) => { setFilterMenuShowDeleted(event.target.checked); }}
                                            />
                                        }
                                    />
                                </FormGroup>
                            </Stack>
                        </FilterMenu>
                    }
                </Stack>
                <Stack
                    direction="row"
                    spacing={2}
                    sx={{ marginLeft: 'auto' }}
                >
                    {
                        authContext?.user.admin &&
                        <Box>
                            <Button
                                startIcon={<AddIcon />}
                                variant="contained"
                                component={RouterLink}
                                to={`create`}
                            >
                                Add
                            </Button>
                        </Box>
                    }
                </Stack>
            </Box>
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
                            <TableCell>ID</TableCell>
                            <TableCell>Username</TableCell>
                            <TableCell>First Name</TableCell>
                            <TableCell>Last Name</TableCell>
                            <TableCell align="right">Admin</TableCell>
                            <TableCell align="right">Created At</TableCell>
                            <TableCell align="right">Updated At</TableCell>
                            {
                                filterMenuShowDeleted &&
                                <TableCell align="right">Deleted At</TableCell>
                            }
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {count !== null &&
                            <TableRow>
                                <TableCell
                                    colSpan={7 + (filterMenuShowDeleted ? 1 : 0)}
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
                        {users.map((row: any) => (
                            <TableRow
                                key={row.name}
                                sx={{ '&:last-child td, &:last-child th': { border: 0 }, }}>
                                <TableCell>
                                    <Tooltip title={row.id} placement="right">
                                        <Link
                                            underline="none"
                                            component={RouterLink}
                                            to={row.id}
                                            color={'text.primary'}
                                        >
                                            <Typography
                                                fontFamily='monospace'
                                                variant='body2'
                                            >
                                                {row.id.substring(0, 8)}
                                            </Typography>
                                        </Link>
                                    </Tooltip>
                                </TableCell>
                                <TableCell>
                                    <Typography
                                        fontFamily='monospace'
                                        variant='body2'
                                    >
                                        {row.username}
                                    </Typography>
                                </TableCell>
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
                                {
                                    filterMenuShowDeleted &&
                                    <TableCell align="right">{row.deletedAt !== null ? DateTime.fromISO(row.deletedAt).toLocal().toLocaleString(DateTime.DATETIME_SHORT) : null}</TableCell>
                                }
                            </TableRow>
                        ))}
                        {loading || (cursor &&
                            <TableRow
                                onClick={() => { handleLoadMoreClick(); }}
                                sx={{ cursor: 'pointer' }}
                            >
                                <TableCell
                                    colSpan={7 + (filterMenuShowDeleted ? 1 : 0)}
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
                                <TableCell colSpan={7 + (filterMenuShowDeleted ? 1 : 0)} padding='none'>
                                    <LinearProgress />
                                </TableCell>
                            </TableRow>
                        }
                    </TableBody>
                </Table>
            </TableContainer>
        </Stack>
    );
};
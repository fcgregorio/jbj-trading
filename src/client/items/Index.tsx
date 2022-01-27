import * as React from 'react';
import {
    useNavigate,
    useLocation,
    Link as RouterLink,
    resolvePath,
} from "react-router-dom";
import {
    Add as AddIcon,
} from '@mui/icons-material';
import {
    Box,
    Button,
    Divider,
    FormControlLabel,
    FormGroup,
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
    Typography,
} from '@mui/material';
import axios, {
    AxiosResponse,
    CancelToken,
    CancelTokenSource
} from 'axios';
import {
    DateTime,
} from 'luxon';
import {
    debounce,
} from 'lodash';
import {
    Item,
} from './Items';
import { AuthContext } from '../Context';
import { FilterMenu } from '../FilterMenu';
import { Android12Switch } from '../Switch';


export default function Index() {
    const navigate = useNavigate();
    const location = useLocation();

    const [authContext,] = React.useContext(AuthContext);

    const [search, setSearch] = React.useState<string>('');
    const [filterMenuShowDeleted, setFilterMenuShowDeleted] = React.useState<boolean>(false);
    const [cursor, setCursor] = React.useState<string | null>(null);

    const [loading, setLoading] = React.useState(false);
    const cancelTokenSourceRef = React.useRef<CancelTokenSource | null>(null);

    const [count, setCount] = React.useState<number | null>(null);
    const [items, setItems] = React.useState<Item[]>([]);

    function handleCreateItem() {
        const newWindow = window.open(resolvePath('create', location.pathname).pathname, '_blank', 'noopener,noreferrer');
        if (newWindow) newWindow.opener = null;
    }

    const queryUnits = React.useMemo(
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
                    callback: (results: { count: number; results: Item[]; }) => void,
                    errorCallback: () => void,
                    cancelToken: CancelToken,
                ) => {
                    startCallback();
                    await axios.get<{ count: number; results: Item[]; }>(
                        `/api${location.pathname}`,
                        {
                            params: request,
                            cancelToken: cancelToken,
                        },
                    )
                        .then(result => result.data)
                        .then((data) => {
                            callback(data);
                        })
                        .catch((error) => {
                            errorCallback();
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
        queryUnits(
            {
                search: search,
                filters: {
                    showDeleted: filterMenuShowDeleted,
                },
            },
            () => {
                setCount(null);
                setItems([]);
                setLoading(true);
            },
            (data: { count: number; results: Item[]; }) => {
                setCount(data.count);
                setItems(data.results);
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
                setLoading(false);
            },
            cancelTokenSource.token);

        return () => {
            cancelTokenSource.cancel();
        };
    }, [queryUnits, search, filterMenuShowDeleted]);

    function handleLoadMoreClick() {
        setLoading(true);
        const source = axios.CancelToken.source();
        cancelTokenSourceRef.current = source;
        axios.get<{ count: number; results: Item[]; }>(
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
            },
        )
            .then(result => result.data)
            .then((data) => {
                setCount(data.count);
                const newItems = [...items, ...data.results];
                setItems(newItems);
                if (newItems.length === data.count) {
                    setCursor(null);
                } else if (data.results.length !== 0) {
                    setCursor(data.results[data.results.length - 1].id);
                } else {
                    setCursor(null);
                }
                setLoading(false);
            })
            .catch((error) => {
                setLoading(false);
            });
    }

    return (
        <Stack spacing={2}
            sx={{
                marginY: 2
            }}
        >
            <Box
                sx={{
                    display: 'flex',
                    justifyContent: 'flex-start',
                    marginX: 2,
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
                                    color="inherit"
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
                                onClick={handleCreateItem}
                            >
                                Add
                            </Button>
                        </Box>
                    }
                </Stack>
            </Box>
            <TableContainer>
                <Table sx={{ minWidth: 650 }} size="small" >
                    <TableHead>
                        <TableRow>
                            <TableCell>ID</TableCell>
                            <TableCell>Name</TableCell>
                            <TableCell align="right">Stock</TableCell>
                            <TableCell align="right">Safety Stock</TableCell>
                            <TableCell>Unit</TableCell>
                            <TableCell>Category</TableCell>
                            <TableCell>Remarks</TableCell>
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
                                    colSpan={10 + (filterMenuShowDeleted ? 1 : 0)}
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
                        {items.map((row: any) => (
                            <TableRow
                                key={row.name}
                                sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                                <TableCell>
                                    <Tooltip title={row.id} placement="right">
                                        <Link
                                            underline="none"
                                            component={RouterLink}
                                            to={row.id}
                                            color={'text.primary'}
                                        >
                                            <Typography fontFamily='monospace'>
                                                {row.id.substring(0, 8)}
                                            </Typography>
                                        </Link>
                                    </Tooltip>
                                </TableCell>
                                <TableCell>{row.name}</TableCell>
                                <TableCell align="right">
                                    <Typography fontFamily='monospace'>
                                        {row.stock}
                                    </Typography>
                                </TableCell>
                                <TableCell align="right">
                                    <Typography fontFamily='monospace'>
                                        {row.safetyStock}
                                    </Typography>
                                </TableCell>
                                <TableCell>{row.Unit.name}</TableCell>
                                <TableCell>{row.Category.name}</TableCell>
                                <TableCell>{row.remarks}</TableCell>
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
                                    colSpan={10 + (filterMenuShowDeleted ? 1 : 0)}
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
                                <TableCell colSpan={10 + (filterMenuShowDeleted ? 1 : 0)} padding='none'>
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
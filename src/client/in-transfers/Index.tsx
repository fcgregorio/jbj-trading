import * as React from 'react';
import {
    useNavigate,
    useLocation,
    Link as RouterLink,
} from "react-router-dom";
import {
    Add as AddIcon,
    Search as SearchIcon
} from '@mui/icons-material';
import {
    DesktopDatePicker,
} from '@mui/lab';
import {
    Box,
    Button,
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
    InTransfer,
} from './InTransfers';
import { useSnackbar } from 'notistack';

export default function Index() {
    const navigate = useNavigate();
    const location = useLocation();
    const { enqueueSnackbar, closeSnackbar } = useSnackbar();

    const [search, setSearch] = React.useState<string>('');
    const [date, setDate] = React.useState<DateTime>(DateTime.now());
    const [cursor, setCursor] = React.useState<string | null>(null);

    const [loading, setLoading] = React.useState(false);
    const cancelTokenSourceRef = React.useRef<CancelTokenSource | null>(null);

    const [count, setCount] = React.useState<number | null>(null);
    const [inTransfers, setInTransfers] = React.useState<InTransfer[]>([]);

    const queryInTransfers = React.useMemo(
        () =>
            debounce(
                async (
                    request: {
                        input: string;
                        date: string | null;
                    },
                    startCallback: () => void,
                    callback: (results: any) => void,
                    errorCallback: () => void,
                    finallyCallback: () => void,
                    cancelToken: CancelToken,
                ) => {
                    startCallback();
                    await axios.get<
                        { count: number; results: InTransfer[]; }
                    >(
                        `/api${location.pathname}`,
                        {
                            params: {
                                search: request.input,
                                date: request.date,
                            },
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

        if (!date.isValid) {
            setCount(null);
            setInTransfers([]);
            setLoading(false);
            return;
        }

        const cancelTokenSource = axios.CancelToken.source();
        queryInTransfers(
            {
                input: search,
                date: (date !== null && date.isValid) ? date.toISO() : null,
            },
            () => {
                setCount(null);
                setInTransfers([]);
                setLoading(true);
            },
            data => {
                setCount(data.count);
                setInTransfers(data.results);
                if (data.results.length === data.count) {
                    setCursor(null);
                } else if (data.results.length !== 0) {
                    setCursor(data.results[data.results.length - 1].id);
                } else {
                    setCursor(null);
                }
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
    }, [queryInTransfers, search, date]);

    async function handleLoadMoreClick() {
        setLoading(true);
        const source = axios.CancelToken.source();
        cancelTokenSourceRef.current = source;
        await axios.get<
            { count: number; results: InTransfer[]; }
        >(
            `/api${location.pathname}`,
            {
                params: {
                    search: search,
                    date: (date !== null && date.isValid) ? date.toISO() : null,
                    cursor: cursor,
                },
                cancelToken: source.token,
            })
            .then(result => result.data)
            .then(data => {
                setCount(data.count);
                const newInTransfers = [...inTransfers, ...data.results];
                setInTransfers(newInTransfers);
                if (newInTransfers.length === data.count) {
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
                    <DesktopDatePicker
                        label="Date"
                        value={date}
                        inputFormat="MM/dd/yyyy"
                        minDate={DateTime.local(2000, 1, 1)}
                        maxDate={DateTime.now()}
                        onChange={(newValue) => {
                            if (newValue === null) {
                                newValue = DateTime.invalid('Cannot be null');
                            }
                            setDate(newValue);
                        }}
                        renderInput={(params) =>
                            <TextField
                                size="small"
                                sx={{ width: 250 }}
                                {...params}
                            />
                        }
                    />
                </Stack>
                <Stack
                    direction="row"
                    spacing={2}
                    sx={{ marginLeft: 'auto' }}
                >

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
                            <TableCell>In-Transaction ID</TableCell>
                            <TableCell>Item ID</TableCell>
                            <TableCell>Item Name</TableCell>
                            <TableCell align="right">Quantity</TableCell>
                            <TableCell>Item Unit</TableCell>
                            <TableCell align="right">Void</TableCell>
                            <TableCell align="right">Created At</TableCell>
                            <TableCell align="right">Updated At</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {count !== null &&
                            <TableRow>
                                <TableCell
                                    colSpan={8}
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
                        {inTransfers.map((row: any) => (
                            <TableRow
                                key={row.transaction + row.item}
                                sx={{
                                    '&:last-child td, &:last-child th': { border: 0 },
                                }}
                            >
                                <TableCell>
                                    <Tooltip title={row.transaction} placement="right">
                                        <Link
                                            underline="none"
                                            component={RouterLink}
                                            to={`/in-transactions/${row.transaction}`}
                                            color={'text.primary'}
                                        >
                                            <Typography
                                                fontFamily='monospace'
                                                variant='body2'
                                            >
                                                {row.transaction.substring(0, 8)}
                                            </Typography>
                                        </Link>
                                    </Tooltip>
                                </TableCell>
                                <TableCell>
                                    <Tooltip title={row.item} placement="right">
                                        <Link
                                            underline="none"
                                            component={RouterLink}
                                            to={`/items/${row.item}`}
                                            color={'text.primary'}
                                        >
                                            <Typography
                                                fontFamily='monospace'
                                                variant='body2'
                                            >
                                                {row.item.substring(0, 8)}
                                            </Typography>
                                        </Link>
                                    </Tooltip>
                                </TableCell>
                                <TableCell>{row.Item.name}</TableCell>
                                <TableCell align="right">
                                    <Typography
                                        fontFamily='monospace'
                                        variant='body2'
                                    >
                                        {row.quantity}
                                    </Typography>
                                </TableCell>
                                <TableCell>{row.Item.Unit.name}</TableCell>
                                <TableCell align="right">
                                    <Typography
                                        fontFamily='monospace'
                                        variant='body2'
                                    >
                                        {row.InTransaction.void.toString()}
                                    </Typography>
                                </TableCell>
                                <TableCell align="right">{DateTime.fromISO(row.createdAt).toLocal().toLocaleString(DateTime.DATETIME_SHORT)}</TableCell>
                                <TableCell align="right">{DateTime.fromISO(row.updatedAt).toLocal().toLocaleString(DateTime.DATETIME_SHORT)}</TableCell>
                            </TableRow>
                        ))}
                        {loading || (cursor &&
                            <TableRow
                                onClick={() => { handleLoadMoreClick(); }}
                                sx={{ cursor: 'pointer' }}
                            >
                                <TableCell
                                    colSpan={8}
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
                                <TableCell colSpan={8} padding='none'>
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
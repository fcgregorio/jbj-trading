import * as React from 'react';
import {
    useNavigate,
    useLocation,
    Link as RouterLink,
} from "react-router-dom";
import {
    Add as AddIcon,
} from '@mui/icons-material';
import {
    DesktopDatePicker,
} from '@mui/lab';
import {
    Box,
    Button,
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
    OutTransfer,
} from './OutTransfers';

export default function Index() {
    const navigate = useNavigate();
    const location = useLocation();

    const [search, setSearch] = React.useState<string>('');
    const [date, setDate] = React.useState<DateTime>(DateTime.now());
    const [cursor, setCursor] = React.useState<string | null>(null);

    const [loading, setLoading] = React.useState(false);
    const cancelTokenSourceRef = React.useRef<CancelTokenSource | null>(null);

    const [count, setCount] = React.useState<number | null>(null);
    const [OutTransfers, setOutTransfers] = React.useState<OutTransfer[]>([]);

    const queryOutTransfers = React.useMemo(
        () =>
            debounce(
                (
                    request: {
                        input: string;
                        date: string | null;
                    },
                    startCallback: () => void,
                    callback: (results: any) => void,
                    errorCallback: () => void,
                    cancelToken: CancelToken,
                ) => {
                    startCallback();
                    axios.get<never, AxiosResponse<any>>(
                        `/api${location.pathname}`,
                        {
                            params: {
                                search: request.input,
                                date: request.date,
                            },
                            cancelToken: cancelToken,
                        },
                    )
                        .then(result => result.data)
                        .then(
                            (data) => {
                                callback(data);
                            },
                            // Note: it's important to handle errors here
                            // instead of a catch() block so that we don't swallow
                            // exceptions from actual bugs in components.
                            (error) => {
                                errorCallback();
                            }
                        );
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
            setOutTransfers([]);
            setLoading(false);
            return;
        }

        const cancelTokenSource = axios.CancelToken.source();
        queryOutTransfers(
            {
                input: search,
                date: (date !== null && date.isValid) ? date.toISO() : null,
            },
            () => {
                setCount(null);
                setOutTransfers([]);
                setLoading(true);
            },
            (data: any) => {
                setCount(data.count);
                setOutTransfers(data.results);
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
    }, [queryOutTransfers, search, date]);

    function handleLoadMoreClick() {
        setLoading(true);
        const source = axios.CancelToken.source();
        cancelTokenSourceRef.current = source;
        axios.get<never, AxiosResponse<any>>(
            `/api${location.pathname}`,
            {
                params: {
                    search: search,
                    date: (date !== null && date.isValid) ? date.toISO() : null,
                    cursor: cursor,
                },
                cancelToken: source.token,
            },
        )
            .then(result => result.data)
            .then(
                (data) => {
                    setCount(data.count);
                    const newOutTransfers = [...OutTransfers, ...data.results];
                    setOutTransfers(newOutTransfers);
                    if (newOutTransfers.length === data.count) {
                        setCursor(null);
                    } else if (data.results.length !== 0) {
                        setCursor(data.results[data.results.length - 1].id);
                    } else {
                        setCursor(null);
                    }
                    setLoading(false);
                },
                // Note: it's important to handle errors here
                // instead of a catch() block so that we don't swallow
                // exceptions from actual bugs in components.
                (error) => {
                    setLoading(false);
                }
            );
    }

    return (
        <Stack spacing={2}
            sx={{
                marginY: 2
            }}>
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
            <TableContainer>
                <Table sx={{ minWidth: 650 }} size="small" >
                    <TableHead>
                        <TableRow>
                            <TableCell>Out-Transaction ID</TableCell>
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
                        {OutTransfers.map((row: any) => (
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
                                            to={`/out-transactions/${row.transaction}`}
                                            color={'text.primary'}
                                        >
                                            <Typography fontFamily='monospace'>
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
                                            <Typography fontFamily='monospace'>
                                                {row.item.substring(0, 8)}
                                            </Typography>
                                        </Link>
                                    </Tooltip>
                                </TableCell>
                                <TableCell>{row.Item.name}</TableCell>
                                <TableCell align="right">
                                    <Typography fontFamily='monospace'>
                                        {row.quantity}
                                    </Typography>
                                </TableCell>
                                <TableCell>{row.Item.Unit.name}</TableCell>
                                <TableCell align="right">
                                    <Typography fontFamily='monospace'>
                                        {row.OutTransaction.void.toString()}
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
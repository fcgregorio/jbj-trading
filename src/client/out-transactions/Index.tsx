import * as React from 'react';
import {
    useNavigate,
    useLocation,
    Link as RouterLink,
    resolvePath,
} from "react-router-dom";
import {
    Add as AddIcon
} from '@mui/icons-material';
import {
    DesktopDatePicker
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
    DateTime
} from 'luxon';
import {
    debounce
} from 'lodash';
import {
    OutTransaction,
} from './OutTransactions';

export default function Index() {
    const navigate = useNavigate();
    const location = useLocation();

    const [search, setSearch] = React.useState<string>('');
    const [date, setDate] = React.useState<DateTime>(DateTime.now());
    const [cursor, setCursor] = React.useState<string | null>(null);

    const [loading, setLoading] = React.useState(false);

    const [count, setCount] = React.useState<number | null>(null);
    const [outTransactions, setOutTransactions] = React.useState<OutTransaction[]>([]);

    const cancelTokenSourceRef = React.useRef<CancelTokenSource | null>(null);

    function handleCreateOutTransaction() {
        const newWindow = window.open(resolvePath('create', location.pathname).pathname, '_blank', 'noopener,noreferrer');
        if (newWindow) newWindow.opener = null;
    }

    const queryOutTransactions = React.useMemo(
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
            setOutTransactions([]);
            setLoading(false);
            return;
        }

        const cancelTokenSource = axios.CancelToken.source();
        queryOutTransactions(
            {
                input: search,
                date: (date !== null && date.isValid) ? date.toISO() : null,
            },
            () => {
                setCount(null);
                setOutTransactions([]);
                setLoading(true);
            },
            (data: any) => {
                setCount(data.count);
                setOutTransactions(data.results);
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
    }, [queryOutTransactions, search, date]);

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
                    const newOutTransactions = [...outTransactions, ...data.results];
                    setOutTransactions(newOutTransactions);
                    if (newOutTransactions.length === data.count) {
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
                    <Box>
                        <Button
                            startIcon={<AddIcon />}
                            variant="contained"
                            onClick={handleCreateOutTransaction}
                        >
                            Add
                        </Button>
                    </Box>
                </Stack>
            </Box>
            <TableContainer>
                <Table sx={{ minWidth: 650 }} size="small" >
                    <TableHead>
                        <TableRow>
                            <TableCell>ID</TableCell>
                            <TableCell>Customer</TableCell>
                            <TableCell>Delivery Receipt</TableCell>
                            <TableCell align="right">Date of Delivery Receipt</TableCell>
                            <TableCell align="right">Void</TableCell>
                            <TableCell align="right">Created At</TableCell>
                            <TableCell align="right">Updated At</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {count !== null &&
                            <TableRow>
                                <TableCell
                                    colSpan={7}
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
                        {outTransactions.map((row: any) => (
                            <TableRow
                                key={row.id}
                                sx={{
                                    '&:last-child td, &:last-child th': { border: 0 },
                                }}
                            >
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
                                <TableCell>{row.customer}</TableCell>
                                <TableCell>{row.deliveryReceipt}</TableCell>
                                <TableCell align="right">{row.dateOfDeliveryReceipt !== null ? DateTime.fromISO(row.dateOfDeliveryReceipt).toLocal().toLocaleString(DateTime.DATE_SHORT) : ''}</TableCell>
                                <TableCell align="right">
                                    <Typography fontFamily='monospace'>
                                        {row.void.toString()}
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
                                    colSpan={7}
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
                                <TableCell colSpan={7} padding='none'>
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
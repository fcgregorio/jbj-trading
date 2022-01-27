import * as React from 'react';
import {
    useNavigate,
    useLocation,
    useParams,
    Link as RouterLink,
} from 'react-router-dom';
import TextField from '@mui/material/TextField';
import axios, { CancelTokenSource } from 'axios';
import EditIcon from '@mui/icons-material/Edit';
import Box from '@mui/system/Box';
import Autocomplete from '@mui/material/Autocomplete';
import { Breadcrumbs, Button, Divider, LinearProgress, Link, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Tooltip, Typography } from '@mui/material';
import { AuthContext } from '../Context';
import { DateTime } from 'luxon';
import { DeleteDialogButton } from '../DeleteDialogButton';
import { DateTimePicker } from '@mui/lab';
import { RestoreDialogButton } from '../RestoreDialogButton';
import { Item, ItemHistory } from './Items';

function History() {
    const location = useLocation();
    const navigate = useNavigate();
    const params = useParams();

    const [loading, setLoading] = React.useState(false);
    const [cursor, setCursor] = React.useState<number | null>(null);
    const cancelTokenSourceRef = React.useRef<CancelTokenSource | null>(null);
    const [count, setCount] = React.useState<number | null>(null);
    const [itemHistories, setItemHistories] = React.useState<ItemHistory[]>([]);

    React.useEffect(() => {
        setLoading(true);
        axios.get<{ count: number; results: ItemHistory[]; }>(`/api${location.pathname}/histories`)
            .then(result => result.data)
            .then(
                (data) => {
                    setCount(data.count);
                    setItemHistories(data.results);
                    if (data.results.length === data.count) {
                        setCursor(null);
                    } else if (data.results.length !== 0) {
                        setCursor(data.results[data.results.length - 1].historyId);
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
            )
            .finally(() => {
                setLoading(false);
            });
    }, [location.pathname]);

    function handleLoadMoreClick() {
        setLoading(true);
        const source = axios.CancelToken.source();
        cancelTokenSourceRef.current = source;
        axios.get<{ count: number; results: ItemHistory[]; }>(
            `/api${location.pathname}/histories`,
            {
                params: {
                    cursor: cursor,
                },
                cancelToken: source.token,
            },
        )
            .then(result => result.data)
            .then(
                (data) => {
                    setCount(data.count);
                    const newItemHistories = [...itemHistories, ...data.results];
                    setItemHistories(newItemHistories);
                    if (newItemHistories.length === data.count) {
                        setCursor(null);
                    } else if (data.results.length !== 0) {
                        setCursor(data.results[data.results.length - 1].historyId);
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
            <TableContainer>
                <Table sx={{ minWidth: 650 }} size="small" >
                    <TableHead>
                        <TableRow>
                            <TableCell>History ID</TableCell>
                            <TableCell>History User</TableCell>
                            <TableCell>Name</TableCell>
                            <TableCell align="right">Stock</TableCell>
                            <TableCell align="right">Safety Stock</TableCell>
                            <TableCell>Unit</TableCell>
                            <TableCell>Category</TableCell>
                            <TableCell>Remarks</TableCell>
                            <TableCell align="right">Created At</TableCell>
                            <TableCell align="right">Updated At</TableCell>
                            <TableCell align="right">Deleted At</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {count !== null &&
                            <TableRow>
                                <TableCell
                                    colSpan={11}
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
                        {itemHistories.map((row: any) => (
                            <TableRow
                                key={row.id}
                                sx={{
                                    '&:last-child td, &:last-child th': { border: 0 },
                                }}
                            >
                                <TableCell>
                                    <Typography fontFamily='monospace'>
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
                                            <Typography fontFamily='monospace'>
                                                {row.historyUser.substring(0, 8)}
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
                                <TableCell align="right">{row.deletedAt !== null ? DateTime.fromISO(row.deletedAt).toLocal().toLocaleString(DateTime.DATETIME_SHORT) : null}</TableCell>
                            </TableRow>
                        ))}
                        {loading || (cursor &&
                            <TableRow
                                onClick={() => { handleLoadMoreClick(); }}
                                sx={{ cursor: 'pointer' }}
                            >
                                <TableCell
                                    colSpan={11}
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
                                <TableCell colSpan={11} padding='none'>
                                    <LinearProgress />
                                </TableCell>
                            </TableRow>
                        }
                    </TableBody>
                </Table>
            </TableContainer>
        </Stack>
    );
}

export default function Show() {
    const navigate = useNavigate();
    const location = useLocation();
    const params = useParams();

    const [authContext,] = React.useContext(AuthContext);

    const [loading, setLoading] = React.useState(false);
    const [item, setItem] = React.useState<Item | null>(null);

    React.useEffect(() => {
        setLoading(true);
        axios.get<Item>(`/api${location.pathname}`)
            .then(result => result.data)
            .then(result => {
                    setItem(result);
                }
            )
            .finally(() => {
                setLoading(false);
            });
    }, [location.pathname]);

    function handleEditItem() {
        navigate('edit');
    }

    function handleDestroyItem() {
        return axios.delete(`/api${location.pathname}`)
            .then(result => result.data)
            .then(result => {
                    navigate('..', { replace: true });
                }
            )
            .finally(() => {

            });
    }

    function handleRestoreItem() {
        return axios.put(`/api${location.pathname}/restore`)
            .then(result => result.data)
            .then(result => {
                    navigate(`../${params.itemID}`, { replace: true });
                }
            )
            .finally(() => {

            });
    }


    return (
        <Box>
            {loading ?
                <LinearProgress />
                :
                <Stack
                    spacing={2}
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
                                        Items
                                    </Link>
                                    <Typography
                                        color="text.primary"
                                    >
                                        {params.itemID}
                                    </Typography>
                                </Breadcrumbs>
                            </Box>
                        </Stack>
                        {
                            item !== null &&
                            <Stack
                                direction="row"
                                spacing={2}
                                sx={{ marginLeft: 'auto' }}
                            >
                                {
                                    authContext?.user.admin &&
                                    (item!.deletedAt === null ? (
                                        <React.Fragment>
                                            <DeleteDialogButton
                                                handleDelete={handleDestroyItem}
                                            />
                                            <Button
                                                startIcon={<EditIcon />}
                                                variant="contained"
                                                onClick={handleEditItem}
                                            >
                                                Edit
                                            </Button>
                                        </React.Fragment>
                                    ) : (
                                        <RestoreDialogButton
                                            handleRestore={handleRestoreItem}
                                        />
                                    ))
                                }
                            </Stack>
                        }
                    </Box>
                    {
                        item !== null &&
                        <React.Fragment>
                            <Stack
                                spacing={2}
                                sx={{
                                    paddingX: 2,
                                }}
                            >
                                <TextField
                                    margin="dense"
                                    id="name"
                                    label="Name"
                                    type="text"
                                    fullWidth
                                    variant="filled"
                                    value={item.name}
                                    InputProps={{
                                        readOnly: true,
                                    }}
                                />
                                <TextField
                                    margin="dense"
                                    id="safetyStock"
                                    label="Safety Stock"
                                    type="number"
                                    variant="filled"
                                    fullWidth
                                    value={item.safetyStock}
                                    inputProps={{
                                        inputMode: 'numeric',
                                        pattern: '[0-9]*',
                                        min: "0",
                                        step: "1",
                                    }}
                                    InputProps={{
                                        readOnly: true,
                                    }}
                                />
                                <TextField
                                    margin="dense"
                                    id="stock"
                                    label="Stock"
                                    type="number"
                                    variant="filled"
                                    fullWidth
                                    value={item.stock}
                                    inputProps={{
                                        inputMode: 'numeric',
                                        pattern: '[0-9]*',
                                        min: "0",
                                        step: "1",
                                    }}
                                    InputProps={{
                                        readOnly: true,
                                    }}
                                />
                                <TextField
                                    margin="dense"
                                    id="remarks"
                                    label="Remarks"
                                    type="text"
                                    fullWidth
                                    multiline
                                    variant="filled"
                                    value={item.remarks}
                                    InputProps={{
                                        readOnly: true,
                                    }}
                                />
                                <Autocomplete
                                    id="unit"
                                    fullWidth
                                    getOptionLabel={(option) =>
                                        typeof option === 'string' ? option : option.name
                                    }
                                    filterOptions={(x) => x}
                                    options={[]}
                                    autoComplete
                                    includeInputInList
                                    filterSelectedOptions
                                    value={item.Unit}
                                    renderInput={(params) => (
                                        <TextField {...params} label="Unit" variant="filled" InputProps={{
                                            readOnly: true,
                                        }} />
                                    )}
                                />
                                <Autocomplete
                                    id="category"
                                    fullWidth
                                    getOptionLabel={(option) =>
                                        typeof option === 'string' ? option : option.name
                                    }
                                    filterOptions={(x) => x}
                                    options={[]}
                                    autoComplete
                                    includeInputInList
                                    filterSelectedOptions
                                    value={item.Category}
                                    renderInput={(params) => (
                                        <TextField {...params} label="Category" variant="filled" InputProps={{
                                            readOnly: true,
                                        }} />
                                    )}
                                />
                                <DateTimePicker
                                    label="Created At"
                                    value={item.createdAt}
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
                                    value={item.updatedAt}
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
                                    value={item.deletedAt}
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
                                    <Divider />
                                    <History />
                                </React.Fragment>
                            }
                        </React.Fragment>
                    }
                </Stack>
            }
        </Box>
    );
}
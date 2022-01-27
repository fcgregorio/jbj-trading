import EditIcon from '@mui/icons-material/Edit';
import DateTimePicker from '@mui/lab/DateTimePicker';
import { Breadcrumbs, Divider, LinearProgress, Link, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Tooltip, Typography } from '@mui/material';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Box from '@mui/system/Box';
import axios, { CancelTokenSource } from 'axios';
import { DateTime } from 'luxon';
import * as React from 'react';
import {
    useLocation,
    useNavigate,
    useParams,
    Link as RouterLink,
} from "react-router-dom";
import { AuthContext } from '../Context';
import { DeleteDialogButton } from '../DeleteDialogButton';
import { RestoreDialogButton } from '../RestoreDialogButton';
import { Category, CategoryHistory } from './Categories';

function History() {
    const location = useLocation();
    const navigate = useNavigate();
    const params = useParams();

    const [loading, setLoading] = React.useState(false);
    const [cursor, setCursor] = React.useState<number | null>(null);
    const cancelTokenSourceRef = React.useRef<CancelTokenSource | null>(null);
    const [count, setCount] = React.useState<number | null>(null);
    const [categoryHistories, setCategoryHistories] = React.useState<CategoryHistory[]>([]);

    React.useEffect(() => {
        setLoading(true);
        axios.get<{ count: number; results: CategoryHistory[]; }>(`/api${location.pathname}/histories`)
            .then(result => result.data)
            .then(
                (data) => {
                    setCount(data.count);
                    setCategoryHistories(data.results);
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
        axios.get<{ count: number; results: CategoryHistory[]; }>(
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
                    const newCategoryHistories = [...categoryHistories, ...data.results];
                    setCategoryHistories(newCategoryHistories);
                    if (newCategoryHistories.length === data.count) {
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
                            <TableCell align="right">Created At</TableCell>
                            <TableCell align="right">Updated At</TableCell>
                            <TableCell align="right">Deleted At</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {count !== null &&
                            <TableRow>
                                <TableCell
                                    colSpan={6}
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
                        {categoryHistories.map((row: any) => (
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
                                    colSpan={6}
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
                                <TableCell colSpan={6} padding='none'>
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
    const [category, setCategory] = React.useState<Category | null>(null);

    React.useEffect(() => {
        setLoading(true);
        axios.get<Category>(`/api${location.pathname}`)
            .then(result => result.data)
            .then(result => {
                    setCategory(result);
                }
            )
            .finally(() => {
                setLoading(false);
            });
    }, [location.pathname]);

    function handleEditCategory() {
        navigate('edit');
    }

    function handleDestroyCategory() {
        return axios.delete(`/api${location.pathname}`)
            .then(result => result.data)
            .then(result => {
                    navigate('..', { replace: true });
                }
            )
            .finally(() => {

            });
    }

    function handleRestoreCategory() {
        return axios.put(`/api${location.pathname}/restore`)
            .then(result => result.data)
            .then(result => {
                    navigate(`../${params.categoryID}`, { replace: true });
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
                                        Categories
                                    </Link>
                                    <Typography
                                        color="text.primary"
                                    >
                                        {params.categoryID}
                                    </Typography>
                                </Breadcrumbs>
                            </Box>
                        </Stack>
                        {
                            category !== null &&
                            <Stack
                                direction="row"
                                spacing={2}
                                sx={{ marginLeft: 'auto' }}
                            >
                                {
                                    authContext?.user.admin &&
                                    (category.deletedAt === null ? (
                                        <React.Fragment>
                                            <DeleteDialogButton
                                                handleDelete={handleDestroyCategory}
                                            />
                                            <Button
                                                startIcon={<EditIcon />}
                                                variant="contained"
                                                onClick={handleEditCategory}
                                            >
                                                Edit
                                            </Button>
                                        </React.Fragment>
                                    ) : (
                                        <RestoreDialogButton
                                            handleRestore={handleRestoreCategory}
                                        />
                                    ))
                                }
                            </Stack>
                        }
                    </Box>
                    {
                        category !== null &&
                        <React.Fragment>
                            < Stack
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
                                    value={category.name}
                                    InputProps={{
                                        readOnly: true,
                                    }}
                                />
                                <DateTimePicker
                                    label="Created At"
                                    value={category.createdAt}
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
                                    value={category.updatedAt}
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
                                    value={category!.deletedAt}
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
                </Stack >
            }
        </Box >
    );
};
import SaveIcon from '@mui/icons-material/Save';
import { DateTimePicker, DesktopDatePicker } from '@mui/lab';
import LoadingButton from '@mui/lab/LoadingButton';
import {
    Box,
    Breadcrumbs,
    Dialog,
    FormControlLabel,
    FormGroup,
    LinearProgress,
    Link,
    Paper,
    Stack,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TextField,
    Toolbar,
    Tooltip,
    Typography
} from '@mui/material';
import axios, { AxiosResponse } from 'axios';
import {
    DateTime
} from 'luxon';
import * as React from 'react';
import {
    useLocation,
    useNavigate,
    useParams,
    Link as RouterLink,
} from 'react-router-dom';
import { ApiEditOutTransaction, EditOutTransaction, OutTransaction, OutTransfer } from './OutTransactions';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { Android12Switch } from '../Switch';

export default function Edit() {
    const navigate = useNavigate();
    const location = useLocation();
    const params = useParams();

    const [loading, setLoading] = React.useState(false);
    const [locked, setLocked] = React.useState(false);

    const formik = useFormik<EditOutTransaction>({
        initialValues: {
            customer: '',
            deliveryReceipt: null,
            dateOfDeliveryReceipt: null,
            void: false,
            disableVoid: false,
            createdAt: DateTime.now(),
            updatedAt: DateTime.now(),
            OutTransfers: [],
        },
        validationSchema: Yup.object().shape({
            customer: Yup.string()
                .required('Required'),
            deliveryReceipt: Yup.string()
                .nullable(),
            dateOfDeliveryReceipt: Yup.date()
                .nullable()
                .typeError('Invalid Date'),
            void: Yup.boolean()
                .required('Required'),
        }),
        onSubmit: async values => {
            try {
                setLocked(true);

                await axios.put<
                    { id: string; },
                    AxiosResponse<{ id: string; }>,
                    ApiEditOutTransaction
                >(
                    `/api${location.pathname}/..`,
                    {
                        customer: values.customer,
                        deliveryReceipt: values.deliveryReceipt,
                        dateOfDeliveryReceipt: values.dateOfDeliveryReceipt !== null && values.dateOfDeliveryReceipt.isValid ? values.dateOfDeliveryReceipt : null,
                        void: values.void!,
                    },
                )
                    .then(result => result.data);

                navigate(`../${params.outTransactionID}`, { replace: true });
            } catch (error) {

            } finally {
                setLocked(false);
            }
        },
    });

    React.useEffect(() => {
        setLoading(true);
        axios.get<OutTransaction>(`/api${location.pathname}/..`)
            .then(result => result.data)
            .then(result => {
                    formik.setFieldValue('customer', result.customer);
                    formik.setFieldValue('deliveryReceipt', result.deliveryReceipt);
                    formik.setFieldValue('dateOfDeliveryReceipt', result.dateOfDeliveryReceipt !== null ? DateTime.fromISO(result.dateOfDeliveryReceipt.toString()) : null);
                    formik.setFieldValue('void', result.void);
                    formik.setFieldValue('disableVoid', result.void);
                    formik.setFieldValue('createdAt', result.createdAt);
                    formik.setFieldValue('updatedAt', result.updatedAt);
                    formik.setFieldValue('OutTransfers', result.OutTransfers);
                }
            )
            .finally(() => {
                setLoading(false);
            });
    }, [location.pathname]);

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
                        <Stack direction="row" spacing={2}>
                            <Box sx={{ marginTop: 'auto' }}>
                                <Breadcrumbs>
                                    <Link
                                        underline="hover"
                                        color="inherit"
                                        component={RouterLink}
                                        to='..'
                                    >
                                        Out-Transactions
                                    </Link>
                                    <Link
                                        underline="hover"
                                        color="inherit"
                                        component={RouterLink}
                                        to={`../${params.outTransactionID}`}
                                    >
                                        {params.outTransactionID}
                                    </Link>
                                    <Typography
                                        color="text.primary"
                                    >
                                        Edit
                                    </Typography>
                                </Breadcrumbs>
                            </Box>
                        </Stack>
                        {
                            formik.dirty &&
                            <Stack
                                direction="row"
                                spacing={2}
                                sx={{ marginLeft: 'auto' }}
                            >
                                <LoadingButton
                                    disabled={!formik.isValid}
                                    loading={locked}
                                    loadingPosition="start"
                                    startIcon={<SaveIcon />}
                                    variant="contained"
                                    onClick={() => { formik.submitForm(); }}
                                >
                                    Save
                                </LoadingButton>
                                <Dialog
                                    open={locked}
                                />
                            </Stack>
                        }
                    </Box>
                    {
                        formik.dirty &&
                        <Stack
                            spacing={2}
                            sx={{
                                paddingX: 2,
                            }}
                        >
                            <TextField
                                autoFocus
                                margin="dense"
                                id="customer"
                                label="Customer"
                                type="text"
                                fullWidth
                                variant="filled"
                                value={formik.values.customer}
                                onChange={formik.handleChange}
                                onBlur={formik.handleBlur}
                                error={formik.touched.customer && Boolean(formik.errors.customer)}
                                helperText={formik.touched.customer && formik.errors.customer}
                            />
                            <TextField
                                margin="dense"
                                id="deliveryReceipt"
                                label="Delivery Receipt"
                                type="text"
                                fullWidth
                                variant="filled"
                                value={formik.values.deliveryReceipt}
                                onChange={formik.handleChange}
                                onBlur={formik.handleBlur}
                                error={formik.touched.deliveryReceipt && Boolean(formik.errors.deliveryReceipt)}
                                helperText={formik.touched.deliveryReceipt && formik.errors.deliveryReceipt}
                            />
                            <DesktopDatePicker
                                label="Date of Delivery Receipt"
                                inputFormat="MM/dd/yyyy"
                                maxDate={DateTime.now()}
                                value={formik.values.dateOfDeliveryReceipt}
                                onChange={(newValue) => { formik.setFieldValue('dateOfDeliveryReceipt', newValue); }}
                                renderInput={(params) =>
                                    <TextField
                                        {...params}
                                        id="dateOfDeliveryReceipt"
                                        fullWidth
                                        variant="filled"
                                        onBlur={formik.handleBlur}
                                        error={formik.touched.dateOfDeliveryReceipt && Boolean(formik.errors.dateOfDeliveryReceipt)}
                                        helperText={formik.touched.dateOfDeliveryReceipt && formik.errors.dateOfDeliveryReceipt}
                                    />
                                }
                            />
                            <FormGroup>
                                <FormControlLabel
                                    label="Void"
                                    sx={{
                                        userSelect: 'none',
                                    }}
                                    control={
                                        <Android12Switch
                                            id='void'
                                            disabled={formik.values.disableVoid}
                                            checked={formik.values.void!}
                                            onChange={formik.handleChange}
                                            onBlur={formik.handleBlur}
                                        />
                                    }
                                />
                            </FormGroup>
                            <DateTimePicker
                                label="Created At"
                                value={formik.values.createdAt}
                                onChange={() => { }}
                                readOnly={true}
                                disabled={true}
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
                                value={formik.values.updatedAt}
                                onChange={() => { }}
                                readOnly={true}
                                disabled={true}
                                renderInput={(params) =>
                                    <TextField
                                        {...params}
                                        fullWidth
                                        variant="filled"
                                    />
                                }
                            />
                            <Paper
                                variant='outlined'
                                sx={{
                                    borderColor: 'rgba(0, 0, 0, 0.42)',
                                    borderStyle: 'dotted',
                                }}
                            >
                                <Toolbar
                                    disableGutters
                                    sx={{
                                        px: '12px',
                                        backgroundColor: 'rgba(0, 0, 0, 0.12)',
                                    }}
                                >
                                    <Typography
                                        sx={{ flex: '1 1 auto' }}
                                        color="text.disabled"
                                        variant="subtitle1"
                                        component="div"
                                    >
                                        In-Transfers
                                    </Typography>
                                </Toolbar>
                                <TableContainer>
                                    <Table sx={{ minWidth: 650 }} size="small" >
                                        <TableHead>
                                            <TableRow>
                                                <TableCell>Item ID</TableCell>
                                                <TableCell>Item Name</TableCell>
                                                <TableCell align="right">Quantity</TableCell>
                                                <TableCell>Item Unit</TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {formik.values.OutTransfers.map((row: OutTransfer) => (
                                                <TableRow
                                                    key={row.item}
                                                    sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
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
                                                    <TableCell>{row.Item!.name}</TableCell>
                                                    <TableCell align="right">
                                                        <Typography fontFamily='monospace'>
                                                            {row.quantity}
                                                        </Typography>
                                                    </TableCell>
                                                    <TableCell>{row.Item!.Unit.name}</TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                            </Paper>
                        </Stack>
                    }
                </Stack>
            }
        </Box >
    );
}
import SaveIcon from '@mui/icons-material/Save';
import {
    DesktopDatePicker,
    LoadingButton
} from '@mui/lab';
import {
    Box,
    Breadcrumbs, Dialog, Link,
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
    Typography,
} from '@mui/material';
import { red } from '@mui/material/colors';
import axios, { AxiosResponse } from 'axios';
import { isSafeInteger } from 'lodash';
import {
    DateTime
} from 'luxon';
import * as React from 'react';
import {
    useNavigate,
    useLocation,
    Link as RouterLink,
} from 'react-router-dom';
import { ApiCreateOutTransaction, CreateOutTransaction, OutTransfer, OutTransferStrip } from './OutTransactions';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { useSnackbar } from 'notistack';

export default function Create() {
    const navigate = useNavigate();
    const location = useLocation();
    const { enqueueSnackbar, closeSnackbar } = useSnackbar();

    const [locked, setLocked] = React.useState(false);

    const [selectedOutTransfer, setSelectedOutTransfer] = React.useState<Readonly<OutTransfer> | null>(null);

    const formik = useFormik<CreateOutTransaction>({
        initialValues: {
            customer: '',
            deliveryReceipt: null,
            dateOfDeliveryReceipt: null,
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
            OutTransfers: Yup.array()
                .min(1, 'Include at least 1 item')
                .required('Required'),
        }),
        onSubmit: async values => {
            setLocked(true);
            await axios.post<
                { id: string; },
                AxiosResponse<{ id: string; }>,
                ApiCreateOutTransaction
            >(
                `/api${location.pathname}/..`,
                {
                    customer: values.customer,
                    deliveryReceipt: values.deliveryReceipt,
                    dateOfDeliveryReceipt: values.dateOfDeliveryReceipt !== null && values.dateOfDeliveryReceipt.isValid ? values.dateOfDeliveryReceipt : null,
                    outTransfers: values.OutTransfers.map<{
                        item: string;
                        quantity: number;
                    }>((outTransfer) => {
                        return {
                            item: outTransfer.item,
                            quantity: outTransfer.quantity,
                        };
                    })
                })
                .then(result => result.data)
                .then(result => {
                    navigate(`../${result}`, { replace: true });
                    enqueueSnackbar('Create out-transaction successful', { variant: 'success' });
                })
                .catch(error => {
                    enqueueSnackbar('Create out-transaction failed', { variant: 'error' });
                    if (error.response) {
                        const data = error.response.data;
                        for (const e of data.errors) {
                            formik.setFieldError(e.path, e.message);
                        }
                    }
                })
                .finally(() => {
                    setLocked(false);
                });
        },
    });

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
                    <Box sx={{ marginTop: 'auto' }}>
                        <Breadcrumbs>
                            <Link
                                underline="hover"
                                color="primaty"
                                component={RouterLink}
                                to='..'
                            >
                                Out-Transactions
                            </Link>
                            <Typography
                                color="text.primary"
                            >
                                Create
                            </Typography>
                        </Breadcrumbs>
                    </Box>
                </Stack>
                <Stack
                    direction="row"
                    spacing={2}
                    sx={{ marginLeft: 'auto' }}
                >
                    <LoadingButton
                        disabled={!formik.dirty || !formik.isValid || selectedOutTransfer !== null}
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
            </Box>
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
                <Stack>
                    <Paper
                        variant='outlined'
                        sx={{
                            border: formik.touched.OutTransfers && Boolean(formik.errors.OutTransfers) ? 2 : 1,
                            borderColor: formik.touched.OutTransfers && Boolean(formik.errors.OutTransfers) ? red[700] : 'rgba(0, 0, 0, 0.42)',
                        }}
                    >
                        <OutTransferStrip
                            outTransfers={formik.values.OutTransfers}
                            handleSave={(outTransfer) => {
                                const value = [...formik.values.OutTransfers];
                                const index = value.findIndex((_outTransfer) => {
                                    return _outTransfer.item === outTransfer.item;
                                });
                                if (index === -1) {
                                    value.push(outTransfer);
                                } else {
                                    value[index].quantity = outTransfer.quantity;
                                }
                                formik.setFieldValue('OutTransfers', value);
                            }}
                            handleBlur={() => { formik.setFieldTouched('OutTransfers', true, true); }}
                            hasError={Boolean(formik.touched.OutTransfers && Boolean(formik.errors.OutTransfers))}
                        />
                        {
                            Boolean(formik.values.OutTransfers.length !== 0)
                            &&
                            <TableContainer>
                                <Table size="small" >
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
                                                onClick={() => {
                                                    setSelectedOutTransfer(row);
                                                }}
                                                key={row.item}
                                                sx={{ '&:last-child td, &:last-child th': { border: 0 }, cursor: 'pointer' }}>
                                                <TableCell>
                                                    <Tooltip title={row.item} placement="right">
                                                        <Typography
                                                            fontFamily='monospace'
                                                            variant='body2'
                                                        >
                                                            {row.item.substring(0, 8)}
                                                        </Typography>
                                                    </Tooltip>
                                                </TableCell>
                                                <TableCell>{row.Item!.name}</TableCell>
                                                <TableCell align="right">
                                                    {
                                                        selectedOutTransfer !== null && selectedOutTransfer.item === row.item
                                                            ?
                                                            <TextField
                                                                autoFocus
                                                                sx={{
                                                                    minWidth: 100
                                                                }}
                                                                fullWidth
                                                                size='small'
                                                                autoComplete="off"
                                                                margin="dense"
                                                                id="quantity"
                                                                type="number"
                                                                variant="outlined"
                                                                value={selectedOutTransfer.quantity}
                                                                onChange={(event) => {
                                                                    setSelectedOutTransfer({
                                                                        ...selectedOutTransfer,
                                                                        quantity: parseInt(event.target.value),
                                                                    });
                                                                }}
                                                                inputProps={{
                                                                    inputMode: 'numeric',
                                                                    pattern: '[0-9]*',
                                                                    min: "0",
                                                                    step: "1",
                                                                }}
                                                                onClick={(event) => {
                                                                    event.stopPropagation();
                                                                }}
                                                                onBlur={(event) => {
                                                                    if (isSafeInteger(selectedOutTransfer.quantity)) {
                                                                        if (selectedOutTransfer.quantity !== 0) {
                                                                            const value = [...formik.values.OutTransfers];
                                                                            const index = value.findIndex((_outTransfer) => {
                                                                                return _outTransfer.item === selectedOutTransfer.item;
                                                                            });
                                                                            value[index].quantity = selectedOutTransfer.quantity;
                                                                            formik.setFieldValue('OutTransfers', value);
                                                                        } else {
                                                                            const value = [...formik.values.OutTransfers];
                                                                            const index = value.findIndex((_outTransfer) => {
                                                                                return _outTransfer.item === selectedOutTransfer.item;
                                                                            });
                                                                            if (index === -1) {
                                                                                throw Error();
                                                                            } else {
                                                                                value.splice(index, 1);
                                                                            }
                                                                            formik.setFieldValue('OutTransfers', value);
                                                                        }
                                                                    }

                                                                    setSelectedOutTransfer(null);
                                                                }}
                                                            />
                                                            :
                                                            <Typography
                                                                fontFamily='monospace'
                                                                variant='body2'
                                                            >
                                                                {row.quantity}
                                                            </Typography>
                                                    }
                                                </TableCell>
                                                <TableCell>{row.Item!.Unit.name}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        }
                    </Paper>
                    {
                        formik.touched.OutTransfers && Boolean(formik.errors.OutTransfers)
                        &&
                        <Typography
                            sx={{ flex: '1 1 auto', mx: '14px', mt: '3px' }}
                            color={red[700]}
                            variant="caption"
                            component="div"
                        >
                            {formik.errors.OutTransfers}
                        </Typography>
                    }
                </Stack>
            </Stack>
        </Stack >
    );
}
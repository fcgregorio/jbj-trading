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
import { ApiCreateInTransaction, CreateInTransaction, InTransfer, InTransferStrip } from './InTransactions';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { useSnackbar } from 'notistack';

export default function Create() {
    const navigate = useNavigate();
    const location = useLocation();
    const { enqueueSnackbar, closeSnackbar } = useSnackbar();

    const [locked, setLocked] = React.useState(false);

    const [selectedInTransfer, setSelectedInTransfer] = React.useState<Readonly<InTransfer> | null>(null);

    const formik = useFormik<CreateInTransaction>({
        initialValues: {
            supplier: '',
            deliveryReceipt: null,
            dateOfDeliveryReceipt: null,
            dateReceived: null,
            InTransfers: [],
        },
        validationSchema: Yup.object().shape({
            supplier: Yup.string()
                .required('Required'),
            deliveryReceipt: Yup.string()
                .nullable(),
            dateOfDeliveryReceipt: Yup.date()
                .nullable()
                .typeError('Invalid Date'),
            dateReceived: Yup.date()
                .nullable()
                .typeError('Invalid Date'),
            InTransfers: Yup.array()
                .min(1, 'Include at least 1 item')
                .required('Required'),
        }),
        onSubmit: async values => {
            setLocked(true);
            await axios.post<
                { id: string; },
                AxiosResponse<{ id: string; }>,
                ApiCreateInTransaction
            >(
                `/api${location.pathname}/..`,
                {
                    supplier: values.supplier,
                    deliveryReceipt: values.deliveryReceipt,
                    dateOfDeliveryReceipt: values.dateOfDeliveryReceipt !== null && values.dateOfDeliveryReceipt.isValid ? values.dateOfDeliveryReceipt : null,
                    dateReceived: values.dateReceived !== null && values.dateReceived.isValid ? values.dateReceived : null,
                    inTransfers: values.InTransfers.map<{
                        item: string;
                        quantity: number;
                    }>((inTransfer) => {
                        return {
                            item: inTransfer.item,
                            quantity: inTransfer.quantity,
                        };
                    })
                })
                .then(result => result.data)
                .then(result => {
                    navigate(`../${result}`, { replace: true });
                    enqueueSnackbar('Create in-transaction successful', { variant: 'success' });
                })
                .catch(error => {
                    enqueueSnackbar('Create in-transaction failed', { variant: 'error' });
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
                                color="primary"
                                component={RouterLink}
                                to='..'
                            >
                                In-Transactions
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
                        disabled={!formik.isValid || selectedInTransfer !== null}
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
                    id="supplier"
                    label="Supplier"
                    type="text"
                    fullWidth
                    variant="filled"
                    value={formik.values.supplier}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    error={formik.touched.supplier && Boolean(formik.errors.supplier)}
                    helperText={formik.touched.supplier && formik.errors.supplier}
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
                <DesktopDatePicker
                    label="Date Received"
                    inputFormat="MM/dd/yyyy"
                    maxDate={DateTime.now()}
                    value={formik.values.dateReceived}
                    onChange={(newValue) => { formik.setFieldValue('dateReceived', newValue); }}
                    renderInput={(params) =>
                        <TextField
                            {...params}
                            id="dateReceived"
                            fullWidth
                            variant="filled"
                            onBlur={formik.handleBlur}
                            error={formik.touched.dateReceived && Boolean(formik.errors.dateReceived)}
                            helperText={formik.touched.dateReceived && formik.errors.dateReceived}
                        />
                    }
                />
                <Stack>
                    <Paper
                        variant='outlined'
                        sx={{
                            border: formik.touched.InTransfers && Boolean(formik.errors.InTransfers) ? 2 : 1,
                            borderColor: formik.touched.InTransfers && Boolean(formik.errors.InTransfers) ? red[700] : 'rgba(0, 0, 0, 0.42)',
                        }}
                    >
                        <InTransferStrip
                            inTransfers={formik.values.InTransfers}
                            handleSave={(inTransfer) => {
                                const value = [...formik.values.InTransfers];
                                const index = value.findIndex((_inTransfer) => {
                                    return _inTransfer.item === inTransfer.item;
                                });
                                if (index === -1) {
                                    value.push(inTransfer);
                                } else {
                                    value[index].quantity = inTransfer.quantity;
                                }
                                formik.setFieldValue('InTransfers', value);
                            }}
                            handleBlur={() => { formik.setFieldTouched('InTransfers', true, true); }}
                            hasError={Boolean(formik.touched.InTransfers && Boolean(formik.errors.InTransfers))}
                        />
                        {
                            Boolean(formik.values.InTransfers.length !== 0)
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
                                        {formik.values.InTransfers.map((row: InTransfer) => (
                                            <TableRow
                                                onClick={() => {
                                                    if (selectedInTransfer === null) {
                                                        setSelectedInTransfer(row);
                                                    }
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
                                                        selectedInTransfer !== null && selectedInTransfer.item === row.item
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
                                                                value={selectedInTransfer.quantity}
                                                                onChange={(event) => {
                                                                    setSelectedInTransfer({
                                                                        ...selectedInTransfer,
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
                                                                    if (isSafeInteger(selectedInTransfer.quantity)) {
                                                                        if (selectedInTransfer.quantity !== 0) {
                                                                            const value = [...formik.values.InTransfers];
                                                                            const index = value.findIndex((_inTransfer) => {
                                                                                return _inTransfer.item === selectedInTransfer.item;
                                                                            });
                                                                            value[index].quantity = selectedInTransfer.quantity;
                                                                            formik.setFieldValue('InTransfers', value);
                                                                        } else {
                                                                            const value = [...formik.values.InTransfers];
                                                                            const index = value.findIndex((_outTransfer) => {
                                                                                return _outTransfer.item === selectedInTransfer.item;
                                                                            });
                                                                            if (index === -1) {
                                                                                throw Error();
                                                                            } else {
                                                                                value.splice(index, 1);
                                                                            }
                                                                            formik.setFieldValue('InTransfers', value);
                                                                        }
                                                                    }

                                                                    setSelectedInTransfer(null);
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
                        formik.touched.InTransfers && Boolean(formik.errors.InTransfers)
                        &&
                        <Typography
                            sx={{ flex: '1 1 auto', mx: '14px', mt: '3px' }}
                            color={red[700]}
                            variant="caption"
                            component="div"
                        >
                            {formik.errors.InTransfers}
                        </Typography>
                    }
                </Stack>
            </Stack>
        </Stack >
    );
}
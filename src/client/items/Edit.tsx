import * as React from 'react';
import {
    useLocation,
    useNavigate,
    useParams,
    Link as RouterLink,
} from 'react-router-dom';
import TextField from '@mui/material/TextField';
import axios, { AxiosResponse, CancelToken } from 'axios';
import LoadingButton from '@mui/lab/LoadingButton';
import SaveIcon from '@mui/icons-material/Save';
import Box from '@mui/system/Box';
import Autocomplete from '@mui/material/Autocomplete';
import throttle from 'lodash/throttle';
import { Breadcrumbs, Dialog, LinearProgress, Link, Stack, Typography } from '@mui/material';
import { DateTimePicker } from '@mui/lab';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { ApiEditItem, Category, EditItem, Item, Unit } from './Items';
import { DateTime } from 'luxon';
import { useSnackbar } from 'notistack';
import { useAsyncEffect } from 'use-async-effect';

export default function Edit() {
    const navigate = useNavigate();
    const location = useLocation();
    const params = useParams();
    const { enqueueSnackbar, closeSnackbar } = useSnackbar();

    const [loading, setLoading] = React.useState(false);
    const [locked, setLocked] = React.useState(false);

    const [unitInputValue, setUnitInputValue] = React.useState('');
    const [unitOptions, setUnitOptions] = React.useState<readonly Unit[]>([]);
    const [categoryInputValue, setCategoryInputValue] = React.useState('');
    const [categoryOptions, setCategoryOptions] = React.useState<readonly Category[]>([]);

    const formik = useFormik<EditItem>({
        initialValues: {
            name: '',
            safetyStock: 0,
            stock: 0,
            remarks: null,
            createdAt: DateTime.now(),
            updatedAt: DateTime.now(),
            deletedAt: null,
            Unit: null,
            Category: null,
        },
        validationSchema: Yup.object().shape({
            name: Yup.string()
                .required('Required'),
            safetyStock: Yup.number()
                .required('Required'),
            stock: Yup.number()
                .required('Required'),
            remarks: Yup.string(),
            Unit: Yup.object({
                id: Yup.string().required(),
                name: Yup.string().required(),
            })
                .nullable()
                .required('Required'),
            Category: Yup.object({
                id: Yup.string().required(),
                name: Yup.string().required(),
            })
                .nullable()
                .required('Required'),
        }),
        onSubmit: async values => {
            setLocked(true);
            await axios.put<
                { id: string; },
                AxiosResponse<{ id: string; }>,
                ApiEditItem
            >(
                `/api${location.pathname}/..`,
                {
                    name: values.name,
                    safetyStock: values.safetyStock,
                    stock: values.stock,
                    remarks: values.remarks,
                    unit: values.Unit!.id!,
                    category: values.Category!.id!,
                })
                .then(result => result.data)
                .then(result => {
                    navigate(`../${params.itemID}`, { replace: true });
                    enqueueSnackbar('Edit item successful', { variant: 'success' });
                })
                .catch(error => {
                    enqueueSnackbar('Edit item failed', { variant: 'error' });
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

    useAsyncEffect(async isActive => {
        setLoading(true);
        await axios.get<Item>(`/api${location.pathname}/..`)
            .then(result => result.data)
            .then(result => {
                formik.setFieldValue('name', result.name);
                formik.setFieldValue('safetyStock', result.safetyStock);
                formik.setFieldValue('stock', result.stock);
                formik.setFieldValue('remarks', result.remarks);
                formik.setFieldValue('Unit', result.Unit);
                formik.setFieldValue('Category', result.Category);
                formik.setFieldValue('createdAt', result.createdAt);
                formik.setFieldValue('updatedAt', result.updatedAt);
                formik.setFieldValue('deletedAt', result.deletedAt);
            })
            .catch(error => {
                enqueueSnackbar('Error loading data', { variant: 'error' });
            })
            .finally(() => {
                setLoading(false);
            });
    }, [location.pathname]);

    const queryUnits = React.useMemo(
        () =>
            throttle(
                async (
                    request: { input: string; },
                    callback: (results: Unit[]) => void,
                    cancelToken: CancelToken,
                ) => {
                    await axios.get<
                        { count: number; results: Unit[]; }
                    >(
                        `/api/units`,
                        {
                            params: {
                                search: request.input,
                                filters: {
                                    showDeleted: false,
                                },
                            },
                            cancelToken: cancelToken,
                        })
                        .then(result => result.data)
                        .then(data => {
                            callback(data.results);
                        });
                },
                200,
            ),
        [],
    );

    React.useEffect(() => {
        const cancelTokenSource = axios.CancelToken.source();

        if (unitInputValue === '') {
            setUnitOptions(formik.values.Unit ? [formik.values.Unit] : []);
            return;
        }

        queryUnits(
            { input: unitInputValue },
            (results: Unit[]) => {
                let newOptions: Unit[] = [];

                if (formik.values.Unit) {
                    newOptions = [formik.values.Unit];
                }

                if (results) {
                    newOptions = [...newOptions, ...results];
                }

                setUnitOptions(newOptions);
            },
            cancelTokenSource.token,
        );

        return () => {
            cancelTokenSource.cancel();
        };
    }, [formik.values.Unit, unitInputValue, queryUnits]);

    const queryCategories = React.useMemo(
        () =>
            throttle(
                async (
                    request: { input: string; },
                    callback: (results: Category[]) => void,
                    cancelToken: CancelToken,
                ) => {
                    await axios.get<
                        { count: number; results: Category[]; }
                    >(
                        `/api/categories`,
                        {
                            params: {
                                search: request.input,
                                filters: {
                                    showDeleted: false,
                                },
                            },
                            cancelToken: cancelToken,
                        })
                        .then(result => result.data)
                        .then(data => {
                            callback(data.results);
                        });
                },
                200,
            ),
        [],
    );

    React.useEffect(() => {
        const cancelTokenSource = axios.CancelToken.source();

        if (categoryInputValue === '') {
            setCategoryOptions(formik.values.Category ? [formik.values.Category] : []);
            return;
        }

        queryCategories(
            { input: categoryInputValue },
            (results: Category[]) => {
                let newOptions: Category[] = [];

                if (formik.values.Category) {
                    newOptions = [formik.values.Category];
                }

                if (results) {
                    newOptions = [...newOptions, ...results];
                }

                setCategoryOptions(newOptions);
            },
            cancelTokenSource.token,
        );

        return () => {
            cancelTokenSource.cancel();
        };
    }, [formik.values.Category, categoryInputValue, queryCategories]);

    return (
        <Stack
            sx={{
                boxSizing: 'border-box',
                flex: '1 1 auto',
            }}
        >
            {loading ?
                <LinearProgress />
                :
                <React.Fragment>
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
                                        Items
                                    </Link>
                                    <Link
                                        underline="hover"
                                        color="primary"
                                        component={RouterLink}
                                        to={`../${params.itemID}`}
                                    >
                                        {params.itemID}
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
                            <Typography
                                variant='caption'
                                // color='text.secondary'
                                display='block'
                            >
                                * Required
                            </Typography>
                            <TextField
                                autoFocus
                                margin="dense"
                                id="name"
                                label="Name*"
                                type="text"
                                fullWidth
                                variant="filled"
                                value={formik.values.name}
                                onChange={formik.handleChange}
                                onBlur={formik.handleBlur}
                                error={formik.touched.name && Boolean(formik.errors.name)}
                                helperText={formik.touched.name && formik.errors.name}
                            />
                            <TextField
                                margin="dense"
                                id="safetyStock"
                                label="Safety Stock*"
                                type="number"
                                fullWidth
                                variant="filled"
                                value={formik.values.safetyStock}
                                onChange={formik.handleChange}
                                onBlur={formik.handleBlur}
                                error={formik.touched.safetyStock && Boolean(formik.errors.safetyStock)}
                                helperText={formik.touched.safetyStock && formik.errors.safetyStock}
                                inputProps={{
                                    inputMode: 'numeric',
                                    pattern: '[0-9]*',
                                    min: "0",
                                    step: "1",
                                }}
                            />
                            <TextField
                                margin="dense"
                                id="stock"
                                label="Stock*"
                                type="number"
                                fullWidth
                                variant="filled"
                                value={formik.values.stock}
                                onChange={formik.handleChange}
                                onBlur={formik.handleBlur}
                                error={formik.touched.stock && Boolean(formik.errors.stock)}
                                helperText={formik.touched.stock && formik.errors.stock}
                                inputProps={{
                                    inputMode: 'numeric',
                                    pattern: '[0-9]*',
                                    min: "0",
                                    step: "1",
                                }}
                            />
                            <TextField
                                margin="dense"
                                id="remarks"
                                label="Remarks"
                                type="text"
                                fullWidth
                                variant="filled"
                                value={formik.values.remarks}
                                onChange={formik.handleChange}
                                onBlur={formik.handleBlur}
                                error={formik.touched.remarks && Boolean(formik.errors.remarks)}
                                helperText={formik.touched.remarks && formik.errors.remarks}
                            />
                            <Autocomplete
                                id="Unit"
                                fullWidth
                                getOptionLabel={(option) => option.name}
                                filterOptions={(x) => x}
                                options={unitOptions}
                                autoComplete
                                includeInputInList
                                filterSelectedOptions
                                value={formik.values.Unit}
                                onChange={(event: any, newValue: Unit | null) => {
                                    setUnitOptions(newValue ? [newValue, ...unitOptions] : unitOptions);
                                    formik.setFieldValue('Unit', newValue, true);
                                }}
                                onBlur={formik.handleBlur}
                                onInputChange={(event, newInputValue) => {
                                    setUnitInputValue(newInputValue);
                                }}
                                renderInput={(params) => (
                                    <TextField
                                        {...params}
                                        label="Unit*"
                                        variant="filled"
                                        error={formik.touched.Unit && Boolean(formik.errors.Unit)}
                                        helperText={formik.touched.Unit && formik.errors.Unit}
                                    />
                                )}
                            />
                            <Autocomplete
                                id="Category"
                                fullWidth
                                getOptionLabel={(option) => option.name}
                                filterOptions={(x) => x}
                                options={categoryOptions}
                                autoComplete
                                includeInputInList
                                filterSelectedOptions
                                value={formik.values.Category}
                                onChange={(event: any, newValue: Category | null) => {
                                    setCategoryOptions(newValue ? [newValue, ...categoryOptions] : categoryOptions);
                                    formik.setFieldValue('Category', newValue, true);
                                }}
                                onBlur={formik.handleBlur}
                                onInputChange={(event, newInputValue) => {
                                    setCategoryInputValue(newInputValue);
                                }}
                                renderInput={(params) => (
                                    <TextField
                                        {...params}
                                        label="Category*"
                                        variant="filled"
                                        error={formik.touched.Category && Boolean(formik.errors.Category)}
                                        helperText={formik.touched.Category && formik.errors.Category}
                                    />
                                )}
                            />
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
                            <DateTimePicker
                                label="Deleted At"
                                value={formik.values.deletedAt}
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
                        </Stack>
                    }
                </React.Fragment>
            }
        </Stack>
    );
};
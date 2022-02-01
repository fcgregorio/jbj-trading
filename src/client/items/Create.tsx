import * as React from 'react';
import {
    useNavigate,
    useLocation,
    Link as RouterLink,
} from 'react-router-dom';
import TextField from '@mui/material/TextField';
import axios, { AxiosResponse, CancelToken } from 'axios';
import LoadingButton from '@mui/lab/LoadingButton';
import SaveIcon from '@mui/icons-material/Save';
import Box from '@mui/system/Box';
import Autocomplete from '@mui/material/Autocomplete';
import throttle from 'lodash/throttle';
import { Breadcrumbs, Dialog, Link, Stack, Typography } from '@mui/material';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { ApiCreateItem, Category, CreateItem, Unit } from './Items';
import { useSnackbar } from 'notistack';

export default function Create() {
    const navigate = useNavigate();
    const location = useLocation();
    const { enqueueSnackbar, closeSnackbar } = useSnackbar();

    const [locked, setLocked] = React.useState(false);

    const [unitInputValue, setUnitInputValue] = React.useState('');
    const [unitOptions, setUnitOptions] = React.useState<readonly Unit[]>([]);
    const [categoryInputValue, setCategoryInputValue] = React.useState('');
    const [categoryOptions, setCategoryOptions] = React.useState<readonly Category[]>([]);

    const formik = useFormik<CreateItem>({
        initialValues: {
            name: '',
            safetyStock: 0,
            stock: 0,
            remarks: '',
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
            await axios.post<
                { id: string; },
                AxiosResponse<{ id: string; }>,
                ApiCreateItem
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
                    navigate(`../${result}`, { replace: true });
                    enqueueSnackbar('Create item successful', { variant: 'success' });
                })
                .catch(error => {
                    enqueueSnackbar('Create item failed', { variant: 'error' });
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
                                color="inherit"
                                component={RouterLink}
                                to='..'
                            >
                                Items
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
                        disabled={!formik.dirty || !formik.isValid}
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
                    id="name"
                    label="Name"
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
                    label="Safety Stock"
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
                    label="Stock"
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
                            label="Unit"
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
                            label="Category"
                            variant="filled"
                            error={formik.touched.Category && Boolean(formik.errors.Category)}
                            helperText={formik.touched.Category && formik.errors.Category}
                        />
                    )}
                />
            </Stack>
        </Stack>
    );
}
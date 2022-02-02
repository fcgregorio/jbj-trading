import SaveIcon from '@mui/icons-material/Save';
import LoadingButton from '@mui/lab/LoadingButton';
import {
    Breadcrumbs,
    Dialog,
    Link,
    Stack,
    Typography,
} from '@mui/material';
import TextField from '@mui/material/TextField';
import Box from '@mui/system/Box';
import axios, {
    AxiosResponse,
} from 'axios';
import * as React from 'react';
import {
    useNavigate,
    useLocation,
    Link as RouterLink,
} from 'react-router-dom';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { ApiCreateUnit, CreateUnit } from './Units';
import { useSnackbar } from 'notistack';

export default function Create() {
    const navigate = useNavigate();
    const location = useLocation();
    const { enqueueSnackbar, closeSnackbar } = useSnackbar();

    const [locked, setLocked] = React.useState(false);

    const formik = useFormik<CreateUnit>({
        initialValues: {
            name: '',
        },
        validationSchema: Yup.object().shape({
            name: Yup.string()
                .required('Required'),
        }),
        onSubmit: async values => {
            setLocked(true);
            await axios.post<
                { id: string; },
                AxiosResponse<{ id: string; }>,
                ApiCreateUnit
            >(
                `/api${location.pathname}/..`,
                {
                    name: values.name,
                })
                .then(result => result.data)
                .then(result => {
                    navigate(`../${result}`, { replace: true });
                    enqueueSnackbar('Create unit successful', { variant: 'success' });
                })
                .catch(error => {
                    enqueueSnackbar('Create unit failed', { variant: 'error' });
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
                                Units
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
            </Stack>
        </Stack >
    );
}
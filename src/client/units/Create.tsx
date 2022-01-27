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

export default function Create() {
    const navigate = useNavigate();
    const location = useLocation();

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
            try {
                setLocked(true);

                const result = await axios.post<
                    { id: string; },
                    AxiosResponse<{ id: string; }>,
                    ApiCreateUnit
                >(
                    `/api${location.pathname}/..`,
                    {
                        name: values.name,
                    },
                )
                    .then(result => result.data);

                navigate(`../${result}`, { replace: true });
            } catch (error) {

            } finally {
                setLocked(false);
            }
        },
    });

    return (
        <Stack spacing={2}
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
import SaveIcon from '@mui/icons-material/Save';
import LoadingButton from '@mui/lab/LoadingButton';
import { Breadcrumbs, Dialog, LinearProgress, Link, Stack, Typography } from '@mui/material';
import TextField from '@mui/material/TextField';
import Box from '@mui/system/Box';
import axios, { AxiosResponse } from 'axios';
import * as React from 'react';
import {
    useLocation,
    useNavigate,
    useParams,
    Link as RouterLink,
} from "react-router-dom";
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { DateTimePicker } from '@mui/lab';
import { ApiEditCategory, Category, EditCategory } from './Categories';
import { DateTime } from 'luxon';

export default function Edit() {
    const navigate = useNavigate();
    const location = useLocation();
    const params = useParams();

    const [loading, setLoading] = React.useState(false);
    const [locked, setLocked] = React.useState(false);

    const formik = useFormik<EditCategory>({
        initialValues: {
            name: '',
            createdAt: DateTime.now(),
            updatedAt: DateTime.now(),
            deletedAt: null,
        },
        validationSchema: Yup.object().shape({
            name: Yup.string()
                .required('Required'),
        }),
        onSubmit: async values => {
            try {
                setLocked(true);

                await axios.put<
                    { id: string; },
                    AxiosResponse<{ id: string; }>,
                    ApiEditCategory
                >(
                    `/api${location.pathname}/..`,
                    {
                        name: values.name,
                    },
                );

                navigate(`../${params.categoryID}`, { replace: true });
            } catch (error) {

            } finally {
                setLocked(false);
            }
        },
    });

    React.useEffect(() => {
        setLoading(true);
        axios.get<Category>(`/api${location.pathname}/..`)
            .then(result => result.data)
            .then(result => {
                    formik.setFieldValue('name', result.name);
                    formik.setFieldValue('createdAt', result.createdAt);
                    formik.setFieldValue('updatedAt', result.updatedAt);
                    formik.setFieldValue('deletedAt', result.deletedAt);
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
                                        Categories
                                    </Link>
                                    <Link
                                        underline="hover"
                                        color="inherit"
                                        component={RouterLink}
                                        to={`../${params.categoryID}`}
                                    >
                                        {params.categoryID}
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
                </Stack>
            }
        </Box >
    );
};
import SaveIcon from '@mui/icons-material/Save';
import DateTimePicker from '@mui/lab/DateTimePicker';
import LoadingButton from '@mui/lab/LoadingButton';
import { Breadcrumbs, Dialog, FormControlLabel, FormGroup, LinearProgress, Link, Stack, Typography } from '@mui/material';
import TextField from '@mui/material/TextField';
import Box from '@mui/system/Box';
import axios, { AxiosResponse } from 'axios';
import * as React from 'react';
import {
    useNavigate,
    useLocation,
    useParams,
    Link as RouterLink,
} from "react-router-dom";
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { Android12Switch } from '../Switch';
import { ApiEditUser, EditUser, User } from './Users';
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

    const formik = useFormik<EditUser>({
        initialValues: {
            username: '',
            firstName: '',
            lastName: '',
            admin: false,
            createdAt: DateTime.now(),
            updatedAt: DateTime.now(),
            deletedAt: null,
        },
        validationSchema: Yup.object().shape({
            username: Yup.string()
                .required('Required'),
            firstName: Yup.string()
                .required('Required'),
            lastName: Yup.string()
                .required('Required'),
            admin: Yup.boolean()
                .required('Required'),
        }),
        onSubmit: async values => {
            setLocked(true);
            await axios.put<
                { id: string; },
                AxiosResponse<{ id: string; }>,
                ApiEditUser
            >(
                `/api${location.pathname}/..`,
                {
                    username: values.username,
                    firstName: values.firstName,
                    lastName: values.lastName,
                    admin: values.admin,
                })
                .then(result => {
                    navigate(`../${params.userID}`, { replace: true });
                    enqueueSnackbar('Edit user successful', { variant: 'success' });
                })
                .catch(error => {
                    enqueueSnackbar('Edit user failed', { variant: 'error' });
                })
                .finally(() => {
                    setLocked(false);
                });
        },
    });

    useAsyncEffect(async isActive => {
        setLoading(true);
        await axios.get<User>(`/api${location.pathname}/..`)
            .then(result => result.data)
            .then(result => {
                formik.setFieldValue('username', result.username);
                formik.setFieldValue('firstName', result.firstName);
                formik.setFieldValue('lastName', result.lastName);
                formik.setFieldValue('admin', result.admin);
                formik.setFieldValue('createdAt', result.createdAt);
                formik.setFieldValue('updatedAt', result.updatedAt);
                formik.setFieldValue('deletedAt', result.deletedAt);
            })
            .catch(error => {
                enqueueSnackbar('Error loading data', { variant: 'error' });
                if (error.response) {
                    const data = error.response.data;
                    for (const e of data.errors) {
                        formik.setFieldError(e.path, e.message);
                    }
                }
            })
            .finally(() => {
                setLoading(false);
            });
    }, [location.pathname]);

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
                                        Users
                                    </Link>
                                    <Link
                                        underline="hover"
                                        color="primary"
                                        component={RouterLink}
                                        to={`../${params.userID}`}
                                    >
                                        {params.userID}
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
                                margin="dense"
                                id="username"
                                label="Username"
                                type="text"
                                autoComplete='new-username'
                                fullWidth
                                variant="filled"
                                value={formik.values.username}
                                onChange={formik.handleChange}
                                onBlur={formik.handleBlur}
                                error={formik.touched.username && Boolean(formik.errors.username)}
                                helperText={formik.touched.username && formik.errors.username}
                            />
                            <TextField
                                margin="dense"
                                id="firstName"
                                label="First Name"
                                type="text"
                                autoComplete='off'
                                fullWidth
                                variant="filled"
                                value={formik.values.firstName}
                                onChange={formik.handleChange}
                                onBlur={formik.handleBlur}
                                error={formik.touched.firstName && Boolean(formik.errors.firstName)}
                                helperText={formik.touched.firstName && formik.errors.firstName}
                            />
                            <TextField
                                margin="dense"
                                id="lastName"
                                label="Last Name"
                                type="text"
                                autoComplete='off'
                                fullWidth
                                variant="filled"
                                value={formik.values.lastName}
                                onChange={formik.handleChange}
                                onBlur={formik.handleBlur}
                                error={formik.touched.lastName && Boolean(formik.errors.lastName)}
                                helperText={formik.touched.lastName && formik.errors.lastName}
                            />
                            <FormGroup>
                                <FormControlLabel
                                    label="Admin"
                                    sx={{
                                        userSelect: 'none',
                                    }}
                                    control={
                                        <Android12Switch
                                            id="admin"
                                            checked={formik.values.admin}
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
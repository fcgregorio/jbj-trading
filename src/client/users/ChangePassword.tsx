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
import { ApiChangePasswordUser, ChangePasswordUser, User } from './Users';
import { DateTime } from 'luxon';
import { useSnackbar } from 'notistack';
import { useAsyncEffect } from 'use-async-effect';

export default function ChangePassword() {
    const navigate = useNavigate();
    const location = useLocation();
    const params = useParams();
    const { enqueueSnackbar, closeSnackbar } = useSnackbar();

    const [loading, setLoading] = React.useState(false);
    const [locked, setLocked] = React.useState(false);

    const formik = useFormik<ChangePasswordUser>({
        initialValues: {
            username: '',
            password: '',
            passwordVerification: '',
            firstName: '',
            lastName: '',
            admin: false,
            createdAt: DateTime.now(),
            updatedAt: DateTime.now(),
            deletedAt: null,
        },
        validationSchema: Yup.object().shape({
            password: Yup.string()
                .min(10, 'Must be at least 10 characters long')
                .matches(/^[A-Za-z0-9]+$/, 'Can only contain lowercase letters, uppercase letters, and characters')
                .required('Required'),
            passwordVerification: Yup.string()
                .test('passwords-match', 'Passwords must match', function (value) {
                    if (this.parent.password === '' && value === '') return false;
                    return this.parent.password === value;
                }),
        }),
        onSubmit: async values => {
            setLocked(true);
            await axios.put<
                { id: string; },
                AxiosResponse<{ id: string; }>,
                ApiChangePasswordUser
            >(
                `/api${location.pathname}`,
                {
                    password: values.password,
                })
                .then(result => result.data)
                .then(result => {
                    navigate(`../${params.userID}`, { replace: true });
                    enqueueSnackbar('Change password successful', { variant: 'success' });
                })
                .catch(error => {
                    enqueueSnackbar('Change password failed', { variant: 'error' });
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
                if (axios.isCancel(error)) return;
                enqueueSnackbar('Error loading data', { variant: 'error' });
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
                                        color="inherit"
                                        component={RouterLink}
                                        to='..'
                                    >
                                        Users
                                    </Link>
                                    <Link
                                        underline="hover"
                                        color="inherit"
                                        component={RouterLink}
                                        to={`../${params.userID}`}
                                    >
                                        {params.userID}
                                    </Link>
                                    <Typography
                                        color="text.primary"
                                    >
                                        Change-Password
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
                                id="password"
                                label="Password"
                                type="password"
                                autoComplete='new-password'
                                fullWidth
                                variant="filled"
                                value={formik.values.password}
                                onChange={formik.handleChange}
                                onBlur={formik.handleBlur}
                                error={formik.touched.password && Boolean(formik.errors.password)}
                                helperText={formik.touched.password && formik.errors.password}
                            />
                            <TextField
                                margin="dense"
                                id="passwordVerification"
                                label="Verify Password"
                                type="password"
                                autoComplete='new-password'
                                fullWidth
                                variant="filled"
                                value={formik.values.passwordVerification}
                                onChange={formik.handleChange}
                                onBlur={formik.handleBlur}
                                error={Boolean(formik.errors.passwordVerification)}
                                helperText={formik.errors.passwordVerification}
                            />
                        </Stack>
                    }
                </React.Fragment>
            }
        </Stack>
    );
};
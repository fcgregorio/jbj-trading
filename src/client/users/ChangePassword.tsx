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

export default function ChangePassword() {
    const navigate = useNavigate();
    const location = useLocation();
    const params = useParams();

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
                .required('Required'),
            passwordVerification: Yup.string()
                .test('passwords-match', 'Passwords must match', function (value) {
                    if (this.parent.password === '' && value === '') return false;
                    return this.parent.password === value;
                }),
        }),
        onSubmit: async values => {
            try {
                setLocked(true);

                await axios.put<
                    { id: string; },
                    AxiosResponse<{ id: string; }>,
                    ApiChangePasswordUser
                >(
                    `/api${location.pathname}`,
                    {
                        password: values.password,
                    },
                )
                    .then(result => result.data);

                navigate(`../${params.userID}`, { replace: true });
            } catch (error) {

            } finally {
                setLocked(false);
            }
        },
    });

    React.useEffect(() => {
        setLoading(true);
        axios.get<User>(`/api${location.pathname}/..`)
            .then(result => result.data)
            .then(result => {
                    formik.setFieldValue('username', result.username);
                    formik.setFieldValue('firstName', result.firstName);
                    formik.setFieldValue('lastName', result.lastName);
                    formik.setFieldValue('admin', result.admin);
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
                </Stack>
            }
        </Box >
    );
};
import SaveIcon from '@mui/icons-material/Save';
import LoadingButton from '@mui/lab/LoadingButton';
import { Breadcrumbs, Dialog, FormControlLabel, FormGroup, Link, Stack, Typography } from '@mui/material';
import { Android12Switch } from '../Switch';
import TextField from '@mui/material/TextField';
import Box from '@mui/system/Box';
import axios, { AxiosResponse } from 'axios';
import * as React from 'react';
import {
    useNavigate,
    useLocation,
    Link as RouterLink,
} from 'react-router-dom';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { ApiCreateUser, CreateUser } from './Users';

export default function Create() {
    const navigate = useNavigate();
    const location = useLocation();

    const [locked, setLocked] = React.useState(false);

    const formik = useFormik<CreateUser>({
        initialValues: {
            username: '',
            firstName: '',
            lastName: '',
            admin: false,
            password: '',
            passwordVerification: '',
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

                const result = await axios.post<
                    { id: string; },
                    AxiosResponse<{ id: string; }>,
                    ApiCreateUser
                >(
                    `/api${location.pathname}/..`,
                    {
                        username: values.username,
                        firstName: values.firstName,
                        lastName: values.lastName,
                        admin: values.admin,
                        password: values.password,
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
                                Users
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
                <TextField
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
        </Stack >
    );
}
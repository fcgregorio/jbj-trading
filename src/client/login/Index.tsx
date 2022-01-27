import { Login } from '@mui/icons-material';
import { LoadingButton } from '@mui/lab';
import { Container, Dialog, Stack, TextField } from '@mui/material';
import axios, { AxiosResponse } from 'axios';
import * as React from 'react';
import {
    useLocation,
    useNavigate,
} from "react-router-dom";
import { AuthContext } from '../Context';
import { User } from '../models';
import { useFormik } from 'formik';
import * as Yup from 'yup';

export default function Index() {
    const navigate = useNavigate();
    const location = useLocation();

    const [authContext, setAuthContext] = React.useContext(AuthContext);

    const [locked, setLocked] = React.useState(false);

    React.useEffect(() => {
        if (authContext !== null) {
            navigate('/', { replace: true });
        }
    }, [navigate, authContext]);

    const formik = useFormik({
        initialValues: {
            username: undefined,
            password: undefined,
        },
        validationSchema: Yup.object().shape({
            username: Yup.string()
                .required('Required'),
            password: Yup.string()
                .required('Required'),
        }),
        onSubmit: async values => {
            try {
                setLocked(true);

                const token = await axios.post<{ username: string; password: string; }, AxiosResponse<string>>(
                    `/api${location.pathname}`,
                    {
                        username: values.username,
                        password: values.password,
                    },
                )
                    .then(result => result.data);

                const user = await axios.get<never, AxiosResponse<User>>(
                    '/api/users/self',
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    },
                )
                    .then(result => result.data);

                setAuthContext({ user: user, token: token });
            } catch (error) {

            } finally {
                setLocked(false);
            }
        },
    });

    return (
        <Container
            sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
            }}
        >
            <Stack
                spacing={2}
                sx={{
                    width: 250,
                    marginTop: 8,
                }}
            >
                <TextField
                    autoFocus
                    margin="dense"
                    id="username"
                    label="Username"
                    type="text"
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
                    id="password"
                    label="Password"
                    type="password"
                    fullWidth
                    variant="filled"
                    value={formik.values.password}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    error={formik.touched.password && Boolean(formik.errors.password)}
                    helperText={formik.touched.password && formik.errors.password}
                />
                <LoadingButton
                    disabled={!formik.dirty || !formik.isValid}
                    loading={locked}
                    loadingPosition="start"
                    startIcon={<Login />}
                    variant="contained"
                    fullWidth
                    onClick={() => { formik.submitForm(); }}
                >
                    Login
                </LoadingButton>
                <Dialog
                    open={locked}
                />
            </Stack>
        </Container>
    );
};

import { Login as LoginIcon } from "@mui/icons-material";
import { LoadingButton } from "@mui/lab";
import { Container, Dialog, Stack, TextField } from "@mui/material";
import axios, { AxiosResponse } from "axios";
import { useFormik } from "formik";
import { useSnackbar } from "notistack";
import * as React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import * as Yup from "yup";
import { AuthContext } from "../Context";
import { User } from "../models";

export default function Index() {
  const navigate = useNavigate();
  const location = useLocation();
  const { enqueueSnackbar, closeSnackbar } = useSnackbar();

  const [authContext, setAuthContext] = React.useContext(AuthContext);

  const [locked, setLocked] = React.useState(false);

  React.useEffect(() => {
    if (authContext !== null) {
      navigate("/", { replace: true });
    }
  }, [navigate, authContext]);

  const formik = useFormik({
    initialValues: {
      username: "",
      password: "",
    },
    validationSchema: Yup.object().shape({
      username: Yup.string().required("Required"),
      password: Yup.string().required("Required"),
    }),
    onSubmit: async (values) => {
      setLocked(true);
      await axios
        .post<
          string,
          AxiosResponse<string>,
          {
            username: string;
            password: string;
          }
        >(`/api${location.pathname}`, {
          username: values.username,
          password: values.password,
        })
        .then((result) => result.data)
        .then((token) => {
          return axios
            .get<User, AxiosResponse<User>>("/api/users/self", {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            })
            .then((result) => result.data)
            .then((user) => {
              setAuthContext({ user: user, token: token });
            });
        })
        .catch((errror) => {
          enqueueSnackbar("Login failed", { variant: "error" });
        })
        .finally(() => {
          setLocked(false);
        });
    },
  });

  return (
    <Container
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
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
          startIcon={<LoginIcon />}
          variant="contained"
          fullWidth
          onClick={() => {
            formik.submitForm();
          }}
        >
          Login
        </LoadingButton>
        <Dialog open={locked} />
      </Stack>
    </Container>
  );
}

import { Save as SaveIcon } from "@mui/icons-material";
import { LoadingButton } from "@mui/lab";
import {
  Box,
  Breadcrumbs,
  Dialog,
  Link,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import axios, { AxiosResponse } from "axios";
import { useFormik } from "formik";
import { useSnackbar } from "notistack";
import * as React from "react";
import { Link as RouterLink, useLocation, useNavigate } from "react-router-dom";
import * as Yup from "yup";
import { ApiCreateUnit, CreateUnit } from "./Units";

export default function Create() {
  const navigate = useNavigate();
  const location = useLocation();
  const { enqueueSnackbar, closeSnackbar } = useSnackbar();

  const [locked, setLocked] = React.useState(false);

  const formik = useFormik<CreateUnit>({
    initialValues: {
      name: "",
    },
    validationSchema: Yup.object().shape({
      name: Yup.string().required("Required"),
    }),
    onSubmit: async (values) => {
      setLocked(true);
      await axios
        .post<{ id: string }, AxiosResponse<{ id: string }>, ApiCreateUnit>(
          `/api${location.pathname}/..`,
          {
            name: values.name,
          }
        )
        .then((result) => result.data)
        .then((result) => {
          navigate(`../${result}`, { replace: true });
          enqueueSnackbar("Create unit successful", { variant: "success" });
        })
        .catch((error) => {
          enqueueSnackbar("Create unit failed", { variant: "error" });
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
        boxSizing: "border-box",
        flex: "1 1 auto",
      }}
    >
      <Box
        sx={{
          display: "flex",
          padding: 2,
        }}
      >
        <Stack direction="row" spacing={2}>
          <Box sx={{ marginTop: "auto" }}>
            <Breadcrumbs>
              <Link
                underline="hover"
                color="primary"
                component={RouterLink}
                to=".."
              >
                Units
              </Link>
              <Typography color="text.primary">Create</Typography>
            </Breadcrumbs>
          </Box>
        </Stack>
        <Stack direction="row" spacing={2} sx={{ marginLeft: "auto" }}>
          <LoadingButton
            disabled={!formik.dirty || !formik.isValid}
            loading={locked}
            loadingPosition="start"
            startIcon={<SaveIcon />}
            variant="contained"
            onClick={() => {
              formik.submitForm();
            }}
          >
            Save
          </LoadingButton>
          <Dialog open={locked} />
        </Stack>
      </Box>
      <Stack
        spacing={2}
        sx={{
          paddingX: 2,
        }}
      >
        <Typography
          variant="caption"
          // color='text.secondary'
          display="block"
        >
          * Required
        </Typography>
        <TextField
          autoFocus
          margin="dense"
          id="name"
          label="Name*"
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
    </Stack>
  );
}

import { Save as SaveIcon } from "@mui/icons-material";
import { DesktopDatePicker, LoadingButton } from "@mui/lab";
import {
  Box,
  Breadcrumbs,
  ButtonGroup,
  colors,
  Dialog,
  Link,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import axios, { AxiosResponse } from "axios";
import { useFormik } from "formik";
import { DateTime } from "luxon";
import { useSnackbar } from "notistack";
import * as React from "react";
import { Link as RouterLink, useLocation, useNavigate } from "react-router-dom";
import * as Yup from "yup";
import {
  ApiCreateOutTransaction,
  CreateOutTransaction,
  OutTransferStrip,
} from "./OutTransactions";
import OutTransfersList from "./OutTransfersList";

// https://usehooks.com/usePrevious/
function usePrevious<T>(value: T): T {
  // The ref object is a generic container whose current property is mutable ...
  // ... and can hold any value, similar to an instance property on a class
  const ref: any = React.useRef<T>();
  // Store current value in ref
  React.useEffect(() => {
    ref.current = value;
  }, [value]); // Only re-run if value changes
  // Return previous value (happens before update in useEffect above)
  return ref.current;
}

export default function Create() {
  const navigate = useNavigate();
  const location = useLocation();
  const { enqueueSnackbar, closeSnackbar } = useSnackbar();

  React.useEffect(() => {
    document.title = `Create Out-Transaction`;
  }, []);

  const [locked, setLocked] = React.useState(false);

  const dateOfDeliveryReceiptInputRef = React.useRef<HTMLInputElement>(null);
  const [dateOfDeliveryReceiptFormat, setDateOfDeliveryReceiptFormat] =
    React.useState<string>("ccc, LLL dd, yyyy");

  const formik = useFormik<CreateOutTransaction>({
    initialValues: {
      customer: "",
      deliveryReceipt: null,
      dateOfDeliveryReceipt: null,
      OutTransfers: [],
      altSubmit: false,
    },
    validationSchema: Yup.object().shape({
      customer: Yup.string().required("Required"),
      deliveryReceipt: Yup.string().nullable(),
      dateOfDeliveryReceipt: Yup.date().nullable().typeError("Invalid Date"),
      OutTransfers: Yup.array()
        .of(
          Yup.object().shape({
            Item: Yup.object(),
            item: Yup.string().required("Required"),
            quantity: Yup.number().nullable().required("Required"),
          })
        )
        .min(1, "Include at least 1 item")
        .required("Required"),
    }),
    onSubmit: async (values) => {
      setLocked(true);
      await axios
        .post<
          { id: string },
          AxiosResponse<{ id: string }>,
          ApiCreateOutTransaction
        >(`/api${location.pathname}/..`, {
          customer: values.customer,
          deliveryReceipt: values.deliveryReceipt,
          dateOfDeliveryReceipt:
            values.dateOfDeliveryReceipt !== null &&
            values.dateOfDeliveryReceipt.isValid
              ? values.dateOfDeliveryReceipt
              : null,
          outTransfers: values.OutTransfers.map<{
            item: string;
            quantity: number;
          }>((outTransfer) => {
            return {
              item: outTransfer.item,
              quantity: outTransfer.quantity!,
            };
          }),
        })
        .then((result) => result.data)
        .then((result) => {
          navigate(`../${result}`, { replace: true });
          if (values.altSubmit) {
            navigate(`../create`, { replace: true });
          }
          enqueueSnackbar("Create out-transaction successful", {
            variant: "success",
          });
        })
        .catch((error) => {
          enqueueSnackbar("Create out-transaction failed", {
            variant: "error",
          });
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

  const prevTouchedOutTransfers: any = usePrevious<any>(
    formik.touched.OutTransfers
  );

  React.useEffect(() => {
    if (
      prevTouchedOutTransfers !== undefined &&
      formik.touched.OutTransfers === undefined
    ) {
      formik.setFieldTouched("OutTransfers", true, true);
    }
  }, [prevTouchedOutTransfers, formik.touched.OutTransfers]);

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
                Out-Transactions
              </Link>
              <Typography color="text.primary">Create</Typography>
            </Breadcrumbs>
          </Box>
        </Stack>
        <Stack direction="row" spacing={2} sx={{ marginLeft: "auto" }}>
          <ButtonGroup>
            <LoadingButton
              disabled={!formik.dirty || !formik.isValid}
              loading={locked}
              loadingPosition="start"
              startIcon={<SaveIcon />}
              variant="contained"
              onClick={async () => {
                await formik.setFieldValue("altSubmit", false);
                await formik.submitForm();
              }}
            >
              Save
            </LoadingButton>
            <LoadingButton
              disabled={!formik.dirty || !formik.isValid}
              loading={locked}
              loadingIndicator=""
              loadingPosition="start"
              variant="contained"
              onClick={async () => {
                await formik.setFieldValue("altSubmit", true);
                await formik.submitForm();
              }}
            >
              Save &amp; Add Another
            </LoadingButton>
          </ButtonGroup>
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
          <br />
          ** Non-empty
        </Typography>
        <TextField
          autoFocus
          margin="dense"
          id="customer"
          label="Customer*"
          type="text"
          fullWidth
          variant="filled"
          value={formik.values.customer}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          error={formik.touched.customer && Boolean(formik.errors.customer)}
          helperText={formik.touched.customer && formik.errors.customer}
        />
        <TextField
          margin="dense"
          id="deliveryReceipt"
          label="Delivery Receipt"
          type="text"
          fullWidth
          variant="filled"
          value={formik.values.deliveryReceipt}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          error={
            formik.touched.deliveryReceipt &&
            Boolean(formik.errors.deliveryReceipt)
          }
          helperText={
            formik.touched.deliveryReceipt && formik.errors.deliveryReceipt
          }
        />
        <DesktopDatePicker
          inputRef={dateOfDeliveryReceiptInputRef}
          label="Date of Delivery Receipt"
          value={formik.values.dateOfDeliveryReceipt}
          inputFormat={dateOfDeliveryReceiptFormat}
          maxDate={DateTime.now()}
          onChange={(newValue) => {
            formik.setFieldValue("dateOfDeliveryReceipt", newValue);
          }}
          onOpen={() => {
            setDateOfDeliveryReceiptFormat("LL/dd/yyyy");
          }}
          onClose={() => {
            setDateOfDeliveryReceiptFormat("ccc, LLL dd, yyyy");
          }}
          renderInput={(params) => (
            <TextField
              {...params}
              id="dateOfDeliveryReceipt"
              fullWidth
              variant="filled"
              onFocusCapture={(event) => {
                if (event.target === dateOfDeliveryReceiptInputRef.current) {
                  setDateOfDeliveryReceiptFormat("LL/dd/yyyy");
                }
              }}
              onBlur={(event) => {
                setDateOfDeliveryReceiptFormat("ccc, LLL dd, yyyy");
                formik.handleBlur(event);
              }}
              error={
                formik.touched.dateOfDeliveryReceipt &&
                Boolean(formik.errors.dateOfDeliveryReceipt)
              }
              helperText={
                formik.touched.dateOfDeliveryReceipt &&
                formik.errors.dateOfDeliveryReceipt
              }
            />
          )}
        />
        <Stack>
          <Paper
            variant="outlined"
            sx={{
              border:
                formik.touched.OutTransfers &&
                Boolean(formik.errors.OutTransfers) &&
                typeof formik.errors.OutTransfers === "string"
                  ? 2
                  : 1,
              borderColor:
                formik.touched.OutTransfers &&
                Boolean(formik.errors.OutTransfers) &&
                typeof formik.errors.OutTransfers === "string"
                  ? colors.red[700]
                  : "rgba(0, 0, 0, 0.42)",
            }}
          >
            <OutTransferStrip
              outTransfers={formik.values.OutTransfers}
              handleSave={(outTransfer) => {
                const value = [...formik.values.OutTransfers];
                const index = value.findIndex((_outTransfer) => {
                  return _outTransfer.item === outTransfer.item;
                });
                if (index === -1) {
                  value.push(outTransfer);
                } else {
                  value[index].quantity = outTransfer.quantity;
                }
                formik.setFieldValue("OutTransfers", value);
              }}
              handleBlur={() => {
                formik.setFieldTouched("OutTransfers", true, true);
              }}
              hasError={Boolean(
                formik.touched.OutTransfers &&
                  Boolean(formik.errors.OutTransfers) &&
                  typeof formik.errors.OutTransfers === "string"
              )}
            />
            {Boolean(formik.values.OutTransfers.length !== 0) && (
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Item ID</TableCell>
                      <TableCell>Item Name</TableCell>
                      <TableCell align="right">Quantity*</TableCell>
                      <TableCell>Item Unit</TableCell>
                      <TableCell />
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    <OutTransfersList formik={formik} />
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Paper>
          {formik.touched.OutTransfers &&
            Boolean(formik.errors.OutTransfers) &&
            typeof formik.errors.OutTransfers === "string" && (
              <Typography
                sx={{ flex: "1 1 auto", mx: "14px", mt: "3px" }}
                color={colors.red[700]}
                variant="caption"
                component="div"
              >
                {formik.errors.OutTransfers}
              </Typography>
            )}
        </Stack>
      </Stack>
    </Stack>
  );
}

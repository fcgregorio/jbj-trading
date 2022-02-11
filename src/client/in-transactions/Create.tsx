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
  ApiCreateInTransaction,
  CreateInTransaction,
  InTransferStrip,
} from "./InTransactions";
import InTransfersList from "./InTransfersList";

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
    document.title = `Create In-Transaction`;
  }, []);

  const [locked, setLocked] = React.useState(false);

  const dateOfDeliveryReceiptInputRef = React.useRef<HTMLInputElement>(null);
  const [dateOfDeliveryReceiptFormat, setDateOfDeliveryReceiptFormat] =
    React.useState<string>("ccc, LLL dd, yyyy");
  const dateReceivedInputRef = React.useRef<HTMLInputElement>(null);
  const [dateReceivedFormat, setDateReceivedFormat] =
    React.useState<string>("ccc, LLL dd, yyyy");

  const formik = useFormik<CreateInTransaction>({
    initialValues: {
      supplier: "",
      deliveryReceipt: null,
      dateOfDeliveryReceipt: null,
      dateReceived: null,
      InTransfers: [],
      altSubmit: false,
    },
    validationSchema: Yup.object().shape({
      supplier: Yup.string().required("Required"),
      deliveryReceipt: Yup.string().nullable(),
      dateOfDeliveryReceipt: Yup.date().nullable().typeError("Invalid Date"),
      dateReceived: Yup.date().nullable().typeError("Invalid Date"),
      InTransfers: Yup.array()
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
          ApiCreateInTransaction
        >(`/api${location.pathname}/..`, {
          supplier: values.supplier,
          deliveryReceipt: values.deliveryReceipt,
          dateOfDeliveryReceipt:
            values.dateOfDeliveryReceipt !== null &&
            values.dateOfDeliveryReceipt.isValid
              ? values.dateOfDeliveryReceipt
              : null,
          dateReceived:
            values.dateReceived !== null && values.dateReceived.isValid
              ? values.dateReceived
              : null,
          inTransfers: values.InTransfers.map<{
            item: string;
            quantity: number;
          }>((inTransfer) => {
            return {
              item: inTransfer.item,
              quantity: inTransfer.quantity!,
            };
          }),
        })
        .then((result) => result.data)
        .then((result) => {
          navigate(`../${result}`, { replace: true });
          if (values.altSubmit) {
            navigate(`../create`, { replace: true });
          }
          enqueueSnackbar("Create in-transaction successful", {
            variant: "success",
          });
        })
        .catch((error) => {
          enqueueSnackbar("Create in-transaction failed", { variant: "error" });
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

  const prevTouchedInTransfers: any = usePrevious<any>(
    formik.touched.InTransfers
  );

  React.useEffect(() => {
    if (
      prevTouchedInTransfers !== undefined &&
      formik.touched.InTransfers === undefined
    ) {
      formik.setFieldTouched("InTransfers", true, true);
    }
  }, [prevTouchedInTransfers, formik.touched.InTransfers]);

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
                In-Transactions
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
          id="supplier"
          label="Supplier*"
          type="text"
          fullWidth
          variant="filled"
          value={formik.values.supplier}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          error={formik.touched.supplier && Boolean(formik.errors.supplier)}
          helperText={formik.touched.supplier && formik.errors.supplier}
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
        <DesktopDatePicker
          inputRef={dateReceivedInputRef}
          label="Date Received"
          value={formik.values.dateReceived}
          inputFormat={dateReceivedFormat}
          maxDate={DateTime.now()}
          onChange={(newValue) => {
            formik.setFieldValue("dateReceived", newValue);
          }}
          onOpen={() => {
            setDateReceivedFormat("LL/dd/yyyy");
          }}
          onClose={() => {
            setDateReceivedFormat("ccc, LLL dd, yyyy");
          }}
          renderInput={(params) => (
            <TextField
              {...params}
              id="dateReceived"
              fullWidth
              variant="filled"
              onFocusCapture={(event) => {
                if (event.target === dateReceivedInputRef.current) {
                  setDateReceivedFormat("LL/dd/yyyy");
                }
              }}
              onBlur={(event) => {
                setDateReceivedFormat("ccc, LLL dd, yyyy");
                formik.handleBlur(event);
              }}
              error={
                formik.touched.dateReceived &&
                Boolean(formik.errors.dateReceived)
              }
              helperText={
                formik.touched.dateReceived && formik.errors.dateReceived
              }
            />
          )}
        />
        <Stack>
          <Paper
            variant="outlined"
            sx={{
              border:
                formik.touched.InTransfers &&
                Boolean(formik.errors.InTransfers) &&
                typeof formik.errors.InTransfers === "string"
                  ? 2
                  : 1,
              borderColor:
                formik.touched.InTransfers &&
                Boolean(formik.errors.InTransfers) &&
                typeof formik.errors.InTransfers === "string"
                  ? colors.red[700]
                  : "rgba(0, 0, 0, 0.42)",
            }}
          >
            <InTransferStrip
              inTransfers={formik.values.InTransfers}
              handleSave={(inTransfer) => {
                const value = [...formik.values.InTransfers];
                const index = value.findIndex((_inTransfer) => {
                  return _inTransfer.item === inTransfer.item;
                });
                if (index === -1) {
                  value.push(inTransfer);
                } else {
                  value[index].quantity = inTransfer.quantity;
                }
                formik.setFieldValue("InTransfers", value);
              }}
              handleBlur={() => {
                formik.setFieldTouched("InTransfers", true, true);
              }}
              hasError={Boolean(
                formik.touched.InTransfers &&
                  Boolean(formik.errors.InTransfers) &&
                  typeof formik.errors.InTransfers === "string"
              )}
            />
            {Boolean(formik.values.InTransfers.length !== 0) && (
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
                    <InTransfersList formik={formik} />
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Paper>
          {formik.touched.InTransfers &&
            Boolean(formik.errors.InTransfers) &&
            typeof formik.errors.InTransfers === "string" && (
              <Typography
                sx={{ flex: "1 1 auto", mx: "14px", mt: "3px" }}
                color={colors.red[700]}
                variant="caption"
                component="div"
              >
                {formik.errors.InTransfers}
              </Typography>
            )}
        </Stack>
      </Stack>
    </Stack>
  );
}

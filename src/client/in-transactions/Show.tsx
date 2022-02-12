import { Edit as EditIcon } from "@mui/icons-material";
import { DateTimePicker, DesktopDatePicker } from "@mui/lab";
import {
  Box,
  Breadcrumbs,
  Button,
  Divider,
  FormControlLabel,
  FormGroup,
  LinearProgress,
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
  Toolbar,
  Tooltip,
  Typography,
} from "@mui/material";
import axios, { CancelTokenSource } from "axios";
import { DateTime } from "luxon";
import { useSnackbar } from "notistack";
import * as React from "react";
import {
  Link as RouterLink,
  useLocation,
  useNavigate,
  useParams,
} from "react-router-dom";
import { useAsyncEffect } from "use-async-effect";
import { AuthContext } from "../Context";
import { Android12Switch } from "../Switch";
import {
  InTransaction,
  InTransactionHistory,
  InTransfer,
} from "./InTransactions";

function History() {
  const location = useLocation();
  const navigate = useNavigate();
  const params = useParams();
  const { enqueueSnackbar, closeSnackbar } = useSnackbar();

  React.useEffect(() => {
    document.title = `In-Transaction ${params.inTransactionID?.slice(0, 8)}`;
  }, []);

  const [loading, setLoading] = React.useState(false);
  const [cursor, setCursor] = React.useState<number | null>(null);
  const cancelTokenSourceRef = React.useRef<CancelTokenSource | null>(null);
  const [count, setCount] = React.useState<number | null>(null);
  const [inTransactionHistories, setInTransactionHistories] = React.useState<
    InTransactionHistory[]
  >([]);

  useAsyncEffect(
    async (isActive) => {
      setLoading(true);
      await axios
        .get<{ count: number; results: InTransactionHistory[] }>(
          `/api${location.pathname}/histories`
        )
        .then((result) => result.data)
        .then((data) => {
          setCount(data.count);
          setInTransactionHistories(data.results);
          if (data.results.length === data.count) {
            setCursor(null);
          } else if (data.results.length !== 0) {
            setCursor(data.results[data.results.length - 1].historyId);
          } else {
            setCursor(null);
          }
        })
        .catch((error) => {
          enqueueSnackbar("Error loading data", { variant: "error" });
        })
        .finally(() => {
          setLoading(false);
        });
    },
    [location.pathname]
  );

  async function handleLoadMoreClick() {
    setLoading(true);
    const source = axios.CancelToken.source();
    cancelTokenSourceRef.current = source;
    await axios
      .get<{ count: number; results: InTransactionHistory[] }>(
        `/api${location.pathname}/histories`,
        {
          params: {
            cursor: cursor,
          },
          cancelToken: source.token,
        }
      )
      .then((result) => result.data)
      .then((data) => {
        setCount(data.count);
        const newUnitHistories = [...inTransactionHistories, ...data.results];
        setInTransactionHistories(newUnitHistories);
        if (newUnitHistories.length === data.count) {
          setCursor(null);
        } else if (data.results.length !== 0) {
          setCursor(data.results[data.results.length - 1].historyId);
        } else {
          setCursor(null);
        }
      })
      .catch((error) => {
        enqueueSnackbar("Error loading data", { variant: "error" });
      })
      .finally(() => {
        setLoading(false);
      });
  }

  return (
    <TableContainer
      sx={{
        flex: "1 0 auto",
        overflowY: "scroll",
        height: "100vh",
      }}
    >
      <Table size="small" stickyHeader>
        <TableHead>
          <TableRow>
            <TableCell>History ID</TableCell>
            <TableCell>History User</TableCell>
            <TableCell>Supplier</TableCell>
            <TableCell>Delivery Receipt</TableCell>
            <TableCell align="right">Date of Delivery Receipt</TableCell>
            <TableCell align="right">Date Received</TableCell>
            <TableCell align="right">Void</TableCell>
            <TableCell align="right">Updated At</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {count !== null && (
            <TableRow>
              <TableCell
                colSpan={8}
                align="right"
                sx={{ background: "rgba(0, 0, 0, 0.06)" }}
              >
                <Typography fontFamily="monospace" variant="overline">
                  {count} {count === 1 ? "item" : "items"}
                </Typography>
              </TableCell>
            </TableRow>
          )}
          {inTransactionHistories.map((row: any) => (
            <TableRow
              key={row.id}
              sx={{
                "&:last-child td, &:last-child th": { border: 0 },
              }}
            >
              <TableCell>
                <Typography fontFamily="monospace" variant="body2">
                  {row.historyId}
                </Typography>
              </TableCell>
              <TableCell>
                <Tooltip title={row.historyUser} placement="right">
                  <Link
                    underline="none"
                    component={RouterLink}
                    to={`/users/${row.historyUser}`}
                    color={"text.primary"}
                  >
                    <Typography fontFamily="monospace" variant="body2">
                      {row.historyUser.substring(0, 8)}
                    </Typography>
                  </Link>
                </Tooltip>
              </TableCell>
              <TableCell>{row.supplier}</TableCell>
              <TableCell>{row.deliveryReceipt}</TableCell>
              <TableCell
                align="right"
                dangerouslySetInnerHTML={{
                  __html:
                    row.dateOfDeliveryReceipt !== null
                      ? DateTime.fromISO(row.dateOfDeliveryReceipt)
                          .toLocal()
                          .toFormat("ccc, LLL'&nbsp;'dd,'&nbsp;'yyyy")
                      : "",
                }}
              />
              <TableCell
                align="right"
                dangerouslySetInnerHTML={{
                  __html:
                    row.dateReceived !== null
                      ? DateTime.fromISO(row.dateReceived)
                          .toLocal()
                          .toFormat("ccc, LLL'&nbsp;'dd,'&nbsp;'yyyy")
                      : "",
                }}
              />
              <TableCell align="right">
                <Typography fontFamily="monospace" variant="body2">
                  {row.void.toString()}
                </Typography>
              </TableCell>
              <TableCell
                align="right"
                dangerouslySetInnerHTML={{
                  __html: DateTime.fromISO(row.createdAt)
                    .toLocal()
                    .toFormat(
                      "ccc, LLL'&nbsp;'dd,'&nbsp;'yyyy, hh:mm:ss.SSS'&nbsp;'a"
                    ),
                }}
              />
              <TableCell
                align="right"
                dangerouslySetInnerHTML={{
                  __html: DateTime.fromISO(row.updatedAt)
                    .toLocal()
                    .toFormat(
                      "ccc, LLL'&nbsp;'dd,'&nbsp;'yyyy, hh:mm:ss.SSS'&nbsp;'a"
                    ),
                }}
              />
            </TableRow>
          ))}
          {loading ||
            (cursor && (
              <TableRow
                onClick={() => {
                  handleLoadMoreClick();
                }}
                sx={{ cursor: "pointer" }}
              >
                <TableCell
                  colSpan={8}
                  align="center"
                  sx={{ background: "rgba(0, 0, 0, 0.06)" }}
                >
                  <Typography variant="button">Load More</Typography>
                </TableCell>
              </TableRow>
            ))}
          {loading && (
            <TableRow>
              <TableCell colSpan={8} padding="none">
                <LinearProgress />
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

export default function Show() {
  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams();
  const { enqueueSnackbar, closeSnackbar } = useSnackbar();

  const [authContext] = React.useContext(AuthContext);

  const [loading, setLoading] = React.useState(false);
  const [inTransaction, setInTransaction] =
    React.useState<InTransaction | null>(null);

  useAsyncEffect(
    async (isActive) => {
      setLoading(true);
      await axios
        .get<InTransaction>(`/api${location.pathname}`)
        .then((result) => result.data)
        .then((data) => {
          setInTransaction(data);
        })
        .catch((error) => {
          enqueueSnackbar("Error loading data", { variant: "error" });
        })
        .finally(() => {
          setLoading(false);
        });
    },
    [location.pathname]
  );

  return (
    <Stack
      sx={{
        boxSizing: "border-box",
        flex: "1 1 auto",
      }}
    >
      {loading ? (
        <LinearProgress />
      ) : (
        <React.Fragment>
          <Box
            sx={{
              display: "flex",
              padding: 2,
            }}
          >
            <Stack direction="row" spacing={2} sx={{ marginRight: "auto" }}>
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
                  <Typography color="text.primary">
                    {params.inTransactionID}
                  </Typography>
                </Breadcrumbs>
              </Box>
            </Stack>
            {inTransaction !== null && (
              <Stack direction="row" spacing={2} sx={{ marginLeft: "auto" }}>
                {authContext?.user.admin && (
                  <React.Fragment>
                    <Button
                      startIcon={<EditIcon />}
                      variant="contained"
                      component={RouterLink}
                      to={`edit`}
                    >
                      Edit
                    </Button>
                  </React.Fragment>
                )}
              </Stack>
            )}
          </Box>
          {inTransaction !== null && (
            <React.Fragment>
              <Stack
                spacing={2}
                sx={{
                  paddingX: 2,
                }}
              >
                <TextField
                  margin="dense"
                  id="supplier"
                  label="Supplier"
                  type="text"
                  fullWidth
                  variant="filled"
                  value={inTransaction!.supplier}
                  InputProps={{
                    readOnly: true,
                  }}
                />
                <TextField
                  margin="dense"
                  id="deliveryReceipt"
                  label="Delivery Receipt"
                  type="text"
                  fullWidth
                  variant="filled"
                  value={inTransaction!.deliveryReceipt}
                  InputProps={{
                    readOnly: true,
                  }}
                />
                <DesktopDatePicker
                  label="Date of Delivery Receipt"
                  inputFormat={"ccc, LLL dd, yyyy"}
                  value={inTransaction!.dateOfDeliveryReceipt}
                  onChange={() => {}}
                  readOnly={true}
                  renderInput={(params) => (
                    <TextField {...params} fullWidth variant="filled" />
                  )}
                />
                <DesktopDatePicker
                  label="Date Received"
                  inputFormat={"ccc, LLL dd, yyyy"}
                  value={inTransaction!.dateReceived}
                  onChange={() => {}}
                  readOnly={true}
                  renderInput={(params) => (
                    <TextField {...params} fullWidth variant="filled" />
                  )}
                />
                <FormGroup
                  sx={{
                    display: "inline-block",
                  }}
                >
                  <FormControlLabel
                    label="Void"
                    sx={{
                      userSelect: "none",
                    }}
                    control={
                      <Android12Switch
                        readOnly={true}
                        checked={inTransaction!.void}
                      />
                    }
                  />
                </FormGroup>
                <DateTimePicker
                  label="Created At"
                  value={inTransaction!.createdAt}
                  inputFormat={"ccc, LLL dd, yyyy, hh:mm:ss.SSS a"}
                  onChange={() => {}}
                  readOnly={true}
                  renderInput={(params) => (
                    <TextField {...params} fullWidth variant="filled" />
                  )}
                />
                <DateTimePicker
                  label="Updated At"
                  value={inTransaction!.updatedAt}
                  inputFormat={"ccc, LLL dd, yyyy, hh:mm:ss.SSS a"}
                  onChange={() => {}}
                  readOnly={true}
                  renderInput={(params) => (
                    <TextField {...params} fullWidth variant="filled" />
                  )}
                />
                <Paper
                  variant="outlined"
                  sx={{
                    borderColor: "rgba(0, 0, 0, 0.42)",
                  }}
                >
                  <Toolbar
                    disableGutters
                    sx={{
                      px: "12px",
                      backgroundColor: "rgba(0, 0, 0, 0.06)",
                      ":hover": {
                        backgroundColor: "rgba(0, 0, 0, 0.09)",
                      },
                    }}
                  >
                    <Typography
                      sx={{ flex: "1 1 auto" }}
                      color="text.secondary"
                      variant="subtitle1"
                      component="div"
                    >
                      In-Transfers
                    </Typography>
                  </Toolbar>
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Item ID</TableCell>
                          <TableCell>Item Name</TableCell>
                          <TableCell align="right">Quantity</TableCell>
                          <TableCell>Item Unit</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {inTransaction!.InTransfers.map((row: InTransfer) => (
                          <TableRow
                            key={row.item}
                            sx={{
                              "&:last-child td, &:last-child th": { border: 0 },
                            }}
                          >
                            <TableCell>
                              <Tooltip title={row.item} placement="right">
                                <Link
                                  underline="none"
                                  component={RouterLink}
                                  to={`/items/${row.item}`}
                                  color={"text.primary"}
                                >
                                  <Typography
                                    fontFamily="monospace"
                                    variant="body2"
                                  >
                                    {row.item.substring(0, 8)}
                                  </Typography>
                                </Link>
                              </Tooltip>
                            </TableCell>
                            <TableCell>{row.Item!.name}</TableCell>
                            <TableCell align="right">
                              <Typography
                                fontFamily="monospace"
                                variant="body2"
                              >
                                {row.quantity}
                              </Typography>
                            </TableCell>
                            <TableCell>{row.Item!.Unit.name}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Paper>
              </Stack>
              {authContext?.user.admin && (
                <React.Fragment>
                  <Divider
                    sx={{
                      marginTop: 2,
                    }}
                  />
                  <History />
                </React.Fragment>
              )}
            </React.Fragment>
          )}
        </React.Fragment>
      )}
    </Stack>
  );
}

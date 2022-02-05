import { Search as SearchIcon } from "@mui/icons-material";
import { DesktopDatePicker } from "@mui/lab";
import {
  Box,
  Button,
  InputAdornment,
  LinearProgress,
  Link,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import axios, { CancelToken, CancelTokenSource } from "axios";
import fileDownload from "js-file-download";
import { debounce } from "lodash";
import { DateTime } from "luxon";
import { useSnackbar } from "notistack";
import * as React from "react";
import { Link as RouterLink, useLocation, useNavigate } from "react-router-dom";
import { AuthContext } from "../Context";
import { Transaction } from "./Transactions";

export default function Index() {
  const navigate = useNavigate();
  const location = useLocation();
  const { enqueueSnackbar, closeSnackbar } = useSnackbar();

  const [authContext] = React.useContext(AuthContext);

  const [search, setSearch] = React.useState<string>("");
  const [date, setDate] = React.useState<DateTime>(DateTime.now());
  const [cursor, setCursor] = React.useState<string | null>(null);

  const [loading, setLoading] = React.useState(false);
  const cancelTokenSourceRef = React.useRef<CancelTokenSource | null>(null);

  const [count, setCount] = React.useState<number | null>(null);
  const [transactions, setTransactions] = React.useState<Transaction[]>([]);

  async function handleExport() {
    const _date = date !== null && date.isValid ? date.toISO() : null;
    if (_date === null) return;

    await axios
      .get<any>(`/api${location.pathname}/export`, {
        params: {
          date: _date,
        },
        responseType: "blob",
      })
      .then((result) => result.data)
      .then((result) => {
        const fileName = date !== null && date.isValid ? date.toISODate() : "";
        fileDownload(
          result,
          fileName,
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        );
      })
      .catch((error) => {
        enqueueSnackbar("Export failed", { variant: "error" });
      });
  }

  const queryTransactions = React.useMemo(
    () =>
      debounce(
        async (
          request: {
            input: string;
            date: string | null;
          },
          startCallback: () => void,
          callback: (results: any) => void,
          errorCallback: () => void,
          finallyCallback: () => void,
          cancelToken: CancelToken
        ) => {
          startCallback();
          await axios
            .get<{ count: number; results: Transaction[] }>(
              `/api${location.pathname}`,
              {
                params: {
                  search: request.input,
                  date: request.date,
                },
                cancelToken: cancelToken,
              }
            )
            .then((result) => result.data)
            .then((data) => {
              callback(data);
            })
            .catch((error) => {
              if (axios.isCancel(error)) return;
              errorCallback();
            })
            .finally(() => {
              finallyCallback();
            });
        },
        200
      ),
    [location.pathname]
  );

  React.useEffect(() => {
    if (cancelTokenSourceRef.current !== null) {
      cancelTokenSourceRef.current.cancel();
      cancelTokenSourceRef.current = null;
    }

    if (!date.isValid) {
      setCount(null);
      setTransactions([]);
      setLoading(false);
      return;
    }

    const cancelTokenSource = axios.CancelToken.source();
    queryTransactions(
      {
        input: search,
        date: date !== null && date.isValid ? date.toISO() : null,
      },
      () => {
        setCount(null);
        setTransactions([]);
        setLoading(true);
      },
      (data) => {
        setCount(data.count);
        setTransactions(data.results);
        if (data.results.length === data.count) {
          setCursor(null);
        } else if (data.results.length !== 0) {
          setCursor(data.results[data.results.length - 1].id);
        } else {
          setCursor(null);
        }
      },
      () => {
        enqueueSnackbar("Error loading data", { variant: "error" });
      },
      () => {
        setLoading(false);
      },
      cancelTokenSource.token
    );

    return () => {
      cancelTokenSource.cancel();
    };
  }, [queryTransactions, search, date]);

  async function handleLoadMoreClick() {
    setLoading(true);
    const source = axios.CancelToken.source();
    cancelTokenSourceRef.current = source;
    await axios
      .get<{ count: number; results: Transaction[] }>(
        `/api${location.pathname}`,
        {
          params: {
            search: search,
            date: date !== null && date.isValid ? date.toISO() : null,
            cursor: cursor,
          },
          cancelToken: source.token,
        }
      )
      .then((result) => result.data)
      .then((data) => {
        setCount(data.count);
        const newTransactions = [...transactions, ...data.results];
        setTransactions(newTransactions);
        if (newTransactions.length === data.count) {
          setCursor(null);
        } else if (data.results.length !== 0) {
          setCursor(data.results[data.results.length - 1].id);
        } else {
          setCursor(null);
        }
      })
      .catch((error) => {
        if (axios.isCancel(error)) return;
        enqueueSnackbar("Error loading data", { variant: "error" });
      })
      .finally(() => {
        setLoading(false);
      });
  }

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
          <TextField
            sx={{ width: 250 }}
            size="small"
            label="Search"
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
            }}
            InputProps={{
              type: "search",
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
          />
          <DesktopDatePicker
            label="Date"
            value={date}
            inputFormat="MM/dd/yyyy"
            minDate={DateTime.local(2000, 1, 1)}
            maxDate={DateTime.now()}
            onChange={(newValue) => {
              if (newValue === null) {
                newValue = DateTime.invalid("Cannot be null");
              }
              setDate(newValue);
            }}
            renderInput={(params) => (
              <TextField size="small" sx={{ width: 250 }} {...params} />
            )}
          />
        </Stack>
        <Stack direction="row" spacing={2} sx={{ marginLeft: "auto" }}>
          {authContext?.user.admin && (
            <Box>
              <Button
                // startIcon={<AddIcon />}
                disabled={!date.isValid}
                variant="contained"
                onClick={handleExport}
              >
                Export
              </Button>
            </Box>
          )}
        </Stack>
      </Box>
      <TableContainer
        sx={{
          flex: "1 1 auto",
          overflowY: "scroll",
          minHeight: "360px",
        }}
      >
        <Table size="small" stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell>Type</TableCell>
              <TableCell>Transaction ID</TableCell>
              <TableCell>Supplier</TableCell>
              <TableCell>Customer</TableCell>
              <TableCell>Delivery Receipt</TableCell>
              <TableCell align="right">Date of Delivery Receipt</TableCell>
              <TableCell align="right">Date Received</TableCell>
              <TableCell align="right">Void</TableCell>
              <TableCell align="right">Created At</TableCell>
              <TableCell align="right">Updated At</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {count !== null && (
              <TableRow>
                <TableCell
                  colSpan={10}
                  align="right"
                  sx={{ background: "rgba(0, 0, 0, 0.06)" }}
                >
                  <Typography fontFamily="monospace" variant="overline">
                    {count} {count === 1 ? "item" : "items"}
                  </Typography>
                </TableCell>
              </TableRow>
            )}
            {transactions.map((row: any) => (
              <TableRow
                key={row.id}
                sx={{
                  "&:last-child td, &:last-child th": { border: 0 },
                }}
              >
                {row.InTransaction && (
                  <React.Fragment>
                    <TableCell>
                      <Typography fontFamily="monospace" variant="body2">
                        In
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Tooltip title={row.id} placement="right">
                        <Link
                          underline="none"
                          component={RouterLink}
                          to={`/in-transactions/${row.inTransaction}`}
                          color={"text.primary"}
                        >
                          <Typography fontFamily="monospace" variant="body2">
                            {row.inTransaction.substring(0, 8)}
                          </Typography>
                        </Link>
                      </Tooltip>
                    </TableCell>
                    <TableCell>{row.InTransaction.supplier}</TableCell>
                    <TableCell
                      sx={{
                        background: "rgba(0, 0, 0, 0.12)",
                      }}
                    ></TableCell>
                    <TableCell>{row.InTransaction.deliveryReceipt}</TableCell>
                    <TableCell align="right">
                      {row.InTransaction.dateOfDeliveryReceipt !== null
                        ? DateTime.fromISO(
                            row.InTransaction.dateOfDeliveryReceipt
                          )
                            .toLocal()
                            .toLocaleString(DateTime.DATE_SHORT)
                        : ""}
                    </TableCell>
                    <TableCell align="right">
                      {row.InTransaction.dateReceived !== null
                        ? DateTime.fromISO(row.InTransaction.dateReceived)
                            .toLocal()
                            .toLocaleString(DateTime.DATE_SHORT)
                        : ""}
                    </TableCell>
                    <TableCell align="right">
                      <Typography fontFamily="monospace" variant="body2">
                        {row.InTransaction.void.toString()}
                      </Typography>
                    </TableCell>
                  </React.Fragment>
                )}
                {row.OutTransaction && (
                  <React.Fragment>
                    <TableCell>
                      <Typography fontFamily="monospace" variant="body2">
                        Out
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Tooltip title={row.id} placement="right">
                        <Link
                          underline="none"
                          component={RouterLink}
                          to={`/out-transactions/${row.outTransaction}`}
                          color={"text.primary"}
                        >
                          <Typography fontFamily="monospace" variant="body2">
                            {row.outTransaction.substring(0, 8)}
                          </Typography>
                        </Link>
                      </Tooltip>
                    </TableCell>
                    <TableCell
                      sx={{
                        background: "rgba(0, 0, 0, 0.12)",
                      }}
                    ></TableCell>
                    <TableCell>{row.OutTransaction.customer}</TableCell>
                    <TableCell>{row.OutTransaction.deliveryReceipt}</TableCell>
                    <TableCell align="right">
                      {row.OutTransaction.dateOfDeliveryReceipt !== null
                        ? DateTime.fromISO(
                            row.OutTransaction.dateOfDeliveryReceipt
                          )
                            .toLocal()
                            .toLocaleString(DateTime.DATE_SHORT)
                        : ""}
                    </TableCell>
                    <TableCell
                      sx={{
                        background: "rgba(0, 0, 0, 0.12)",
                      }}
                    ></TableCell>
                    <TableCell align="right">
                      <Typography fontFamily="monospace" variant="body2">
                        {row.OutTransaction.void.toString()}
                      </Typography>
                    </TableCell>
                  </React.Fragment>
                )}
                <TableCell align="right">
                  {DateTime.fromISO(row.createdAt)
                    .toLocal()
                    .toLocaleString(DateTime.DATETIME_SHORT)}
                </TableCell>
                <TableCell align="right">
                  {DateTime.fromISO(row.updatedAt)
                    .toLocal()
                    .toLocaleString(DateTime.DATETIME_SHORT)}
                </TableCell>
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
                    colSpan={10}
                    align="center"
                    sx={{ background: "rgba(0, 0, 0, 0.06)" }}
                  >
                    <Typography variant="button">Load More</Typography>
                  </TableCell>
                </TableRow>
              ))}
            {loading && (
              <TableRow>
                <TableCell colSpan={10} padding="none">
                  <LinearProgress />
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Stack>
  );
}

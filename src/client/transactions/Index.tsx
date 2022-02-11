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
  TableSortLabel,
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
import { AuthContext, DateTimeContext } from "../Context";
import DatePicker from "../DatePicker";
import { Transaction } from "./Transactions";

export default function Index() {
  const [dateTimeContext] = React.useContext(DateTimeContext);

  const navigate = useNavigate();
  const location = useLocation();
  const { enqueueSnackbar, closeSnackbar } = useSnackbar();

  React.useEffect(() => {
    document.title = `Transactions`;
  }, []);

  const [authContext] = React.useContext(AuthContext);

  const [search, setSearch] = React.useState<string>("");
  const [cursor, setCursor] = React.useState<string | null>(null);
  const [order, setOrder] = React.useState<{
    by: string;
    direction: "asc" | "desc";
  }>({ by: "updatedAt", direction: "desc" });

  const [loading, setLoading] = React.useState(false);
  const cancelTokenSourceRef = React.useRef<CancelTokenSource | null>(null);

  const [count, setCount] = React.useState<number | null>(null);
  const [transactions, setTransactions] = React.useState<Transaction[]>([]);

  async function handleExport() {
    const _date = dateTimeContext.isValid ? dateTimeContext.toISO() : null;
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
        const fileName = dateTimeContext.isValid
          ? dateTimeContext.toISODate()
          : "";
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
            search: string;
            date: string | null;
            order: {
              by: string;
              direction: string;
            };
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
                params: request,
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

    if (!dateTimeContext.isValid) {
      setCount(null);
      setTransactions([]);
      setLoading(false);
      return;
    }

    const cancelTokenSource = axios.CancelToken.source();
    queryTransactions(
      {
        search: search,
        date: dateTimeContext.isValid ? dateTimeContext.toISO() : null,
        order: order,
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
  }, [queryTransactions, search, dateTimeContext, order]);

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
            date: dateTimeContext.isValid ? dateTimeContext.toISO() : null,
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

  function handleChangeSort(defaultOrder: {
    by: string;
    direction: "asc" | "desc";
  }) {
    if (order.by === defaultOrder.by) {
      setOrder({
        ...order,
        direction: order.direction === "asc" ? "desc" : "asc",
      });
    } else {
      setOrder(defaultOrder);
    }
  }

  const rows = React.useMemo(() => {
    return transactions.map((row: any) => (
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
            <TableCell
              align="right"
              dangerouslySetInnerHTML={{
                __html:
                  row.InTransaction.dateOfDeliveryReceipt !== null
                    ? DateTime.fromISO(row.InTransaction.dateOfDeliveryReceipt)
                        .toLocal()
                        .toFormat("ccc, LLL'&nbsp;'dd,'&nbsp;'yyyy")
                    : "",
              }}
            />
            <TableCell
              align="right"
              dangerouslySetInnerHTML={{
                __html:
                  row.InTransaction.dateReceived !== null
                    ? DateTime.fromISO(row.InTransaction.dateReceived)
                        .toLocal()
                        .toFormat("ccc, LLL'&nbsp;'dd,'&nbsp;'yyyy")
                    : "",
              }}
            />
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
            <TableCell
              align="right"
              dangerouslySetInnerHTML={{
                __html:
                  row.OutTransaction.dateOfDeliveryReceipt !== null
                    ? DateTime.fromISO(row.OutTransaction.dateOfDeliveryReceipt)
                        .toLocal()
                        .toFormat("ccc, LLL'&nbsp;'dd,'&nbsp;'yyyy")
                    : "",
              }}
            />
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
    ));
  }, [transactions]);

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
          <DatePicker />
        </Stack>
        <Stack direction="row" spacing={2} sx={{ marginLeft: "auto" }}>
          {authContext?.user.admin && (
            <Box>
              <Button
                // startIcon={<AddIcon />}
                disabled={!dateTimeContext.isValid}
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
              <TableCell>
                <TableSortLabel
                  active={order.by === "supplier"}
                  direction={order.by === "supplier" ? order.direction : "asc"}
                  onClick={() => {
                    handleChangeSort({ by: "supplier", direction: "asc" });
                  }}
                >
                  Supplier
                </TableSortLabel>
              </TableCell>
              <TableCell>
                <TableSortLabel
                  active={order.by === "customer"}
                  direction={order.by === "customer" ? order.direction : "asc"}
                  onClick={() => {
                    handleChangeSort({ by: "customer", direction: "asc" });
                  }}
                >
                  Customer
                </TableSortLabel>
              </TableCell>
              <TableCell>
                <TableSortLabel
                  active={order.by === "deliveryReceipt"}
                  direction={
                    order.by === "deliveryReceipt" ? order.direction : "asc"
                  }
                  onClick={() => {
                    handleChangeSort({
                      by: "deliveryReceipt",
                      direction: "asc",
                    });
                  }}
                >
                  Delivery Receipt
                </TableSortLabel>
              </TableCell>
              <TableCell align="right">
                <TableSortLabel
                  active={order.by === "dateOfDeliveryReceipt"}
                  direction={
                    order.by === "dateOfDeliveryReceipt"
                      ? order.direction
                      : "desc"
                  }
                  onClick={() => {
                    handleChangeSort({
                      by: "dateOfDeliveryReceipt",
                      direction: "desc",
                    });
                  }}
                >
                  Date of Delivery Receipt
                </TableSortLabel>
              </TableCell>
              <TableCell align="right">
                <TableSortLabel
                  active={order.by === "dateReceived"}
                  direction={
                    order.by === "dateReceived" ? order.direction : "desc"
                  }
                  onClick={() => {
                    handleChangeSort({ by: "dateReceived", direction: "desc" });
                  }}
                >
                  Date Received
                </TableSortLabel>
              </TableCell>
              <TableCell align="right">
                <TableSortLabel
                  active={order.by === "void"}
                  direction={order.by === "void" ? order.direction : "asc"}
                  onClick={() => {
                    handleChangeSort({ by: "void", direction: "asc" });
                  }}
                >
                  Void
                </TableSortLabel>
              </TableCell>
              <TableCell align="right">
                <TableSortLabel
                  active={order.by === "createdAt"}
                  direction={
                    order.by === "createdAt" ? order.direction : "desc"
                  }
                  onClick={() => {
                    handleChangeSort({ by: "createdAt", direction: "desc" });
                  }}
                >
                  Created At
                </TableSortLabel>
              </TableCell>
              <TableCell align="right">
                <TableSortLabel
                  active={order.by === "updatedAt"}
                  direction={
                    order.by === "updatedAt" ? order.direction : "desc"
                  }
                  onClick={() => {
                    handleChangeSort({ by: "updatedAt", direction: "desc" });
                  }}
                >
                  Updated At
                </TableSortLabel>
              </TableCell>
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
            {rows}
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

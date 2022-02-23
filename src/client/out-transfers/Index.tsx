import {
  Refresh as RefreshIcon,
  Search as SearchIcon,
} from "@mui/icons-material";
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
import { debounce } from "lodash";
import { DateTime } from "luxon";
import { useSnackbar } from "notistack";
import * as React from "react";
import { Link as RouterLink, useLocation, useNavigate } from "react-router-dom";
import { DateTimeContext } from "../Context";
import DatePicker from "../DatePicker";
import { OutTransfer } from "./OutTransfers";

export default function Index() {
  const [dateTimeContext] = React.useContext(DateTimeContext);

  const navigate = useNavigate();
  const location = useLocation();
  const { enqueueSnackbar, closeSnackbar } = useSnackbar();

  React.useEffect(() => {
    document.title = `Out-Transfers`;
  }, []);

  const [search, setSearch] = React.useState<string>("");
  const [cursor, setCursor] = React.useState<string | null>(null);
  const [order, setOrder] = React.useState<{
    by: string;
    direction: "asc" | "desc";
  }>({ by: "updatedAt", direction: "desc" });

  const [loading, setLoading] = React.useState(false);
  const cancelTokenSourceRef = React.useRef<CancelTokenSource | null>(null);

  const [count, setCount] = React.useState<number | null>(null);
  const [outTransfers, setOutTransfers] = React.useState<OutTransfer[]>([]);

  const [refresh, setRefresh] = React.useState<boolean>(false);

  const queryOutTransfers = React.useMemo(
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
            .get<{ count: number; results: OutTransfer[] }>(
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
      setOutTransfers([]);
      setLoading(false);
      return;
    }

    const cancelTokenSource = axios.CancelToken.source();
    queryOutTransfers(
      {
        search: search,
        date: dateTimeContext.isValid ? dateTimeContext.toISO() : null,
        order: order,
      },
      () => {
        setCount(null);
        setOutTransfers([]);
        setLoading(true);
      },
      (data) => {
        setCount(data.count);
        setOutTransfers(data.results);
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
  }, [queryOutTransfers, refresh, search, dateTimeContext, order]);

  async function handleLoadMoreClick() {
    setLoading(true);
    const source = axios.CancelToken.source();
    cancelTokenSourceRef.current = source;
    await axios
      .get<{ count: number; results: OutTransfer[] }>(
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
        const newOutTransfers = [...outTransfers, ...data.results];
        setOutTransfers(newOutTransfers);
        if (newOutTransfers.length === data.count) {
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

  const [numberFormat] = React.useState(new Intl.NumberFormat("en-US"));

  const rows = React.useMemo(() => {
    return outTransfers.map((row: any) => (
      <TableRow
        key={row.transaction + row.item}
        sx={{
          "&:last-child td, &:last-child th": { border: 0 },
        }}
      >
        <TableCell>
          <Tooltip title={row.transaction} placement="right">
            <Link
              underline="none"
              component={RouterLink}
              to={`/out-transactions/${row.transaction}`}
              color={"text.primary"}
            >
              <Typography fontFamily="monospace" variant="body2">
                {row.transaction.substring(0, 8)}
              </Typography>
            </Link>
          </Tooltip>
        </TableCell>
        <TableCell>
          <Tooltip title={row.item} placement="right">
            <Link
              underline="none"
              component={RouterLink}
              to={`/items/${row.item}`}
              color={"text.primary"}
            >
              <Typography fontFamily="monospace" variant="body2">
                {row.item.substring(0, 8)}
              </Typography>
            </Link>
          </Tooltip>
        </TableCell>
        <TableCell>{row.Item.name}</TableCell>
        <TableCell align="right">
          <Typography fontFamily="monospace" variant="body2">
            {numberFormat.format(row.quantity)}
          </Typography>
        </TableCell>
        <TableCell>{row.Item.Unit.name}</TableCell>
        <TableCell>{row.Item.Category.name}</TableCell>
        <TableCell align="right">
          <Typography fontFamily="monospace" variant="body2">
            {row.OutTransaction.void.toString()}
          </Typography>
        </TableCell>
        <TableCell align="right">
          {DateTime.fromISO(row.createdAt)
            .toLocal()
            .toFormat("ccc, LLL  dd,  yyyy, hh:mm:ss.SSS  a")
            .replace(/ {2}/g, "\u00a0")}
        </TableCell>
        <TableCell align="right">
          {DateTime.fromISO(row.updatedAt)
            .toLocal()
            .toFormat("ccc, LLL  dd,  yyyy, hh:mm:ss.SSS  a")
            .replace(/ {2}/g, "\u00a0")}
        </TableCell>
      </TableRow>
    ));
  }, [outTransfers]);

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
          <Box>
            <Button
              startIcon={<RefreshIcon />}
              variant="contained"
              onClick={() => {
                setRefresh(!refresh);
              }}
            >
              Refresh
            </Button>
          </Box>
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
              <TableCell>Out-Transaction ID</TableCell>
              <TableCell>Item ID</TableCell>
              <TableCell>
                <TableSortLabel
                  active={order.by === "item"}
                  direction={order.by === "item" ? order.direction : "asc"}
                  onClick={() => {
                    handleChangeSort({ by: "item", direction: "asc" });
                  }}
                >
                  Item Name
                </TableSortLabel>
              </TableCell>
              <TableCell align="right">Quantity</TableCell>
              <TableCell>
                <TableSortLabel
                  active={order.by === "unit"}
                  direction={order.by === "unit" ? order.direction : "asc"}
                  onClick={() => {
                    handleChangeSort({ by: "unit", direction: "asc" });
                  }}
                >
                  Item Unit
                </TableSortLabel>
              </TableCell>
              <TableCell>
                <TableSortLabel
                  active={order.by === "category"}
                  direction={order.by === "category" ? order.direction : "asc"}
                  onClick={() => {
                    handleChangeSort({ by: "category", direction: "asc" });
                  }}
                >
                  Item Category
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
                  colSpan={9}
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
                    colSpan={9}
                    align="center"
                    sx={{ background: "rgba(0, 0, 0, 0.06)" }}
                  >
                    <Typography variant="button">Load More</Typography>
                  </TableCell>
                </TableRow>
              ))}
            {loading && (
              <TableRow>
                <TableCell colSpan={9} padding="none">
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

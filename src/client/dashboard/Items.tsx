import { Refresh as RefreshIcon } from "@mui/icons-material";
import {
  Box,
  Button,
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
  Tooltip,
  Typography,
} from "@mui/material";
import axios, { CancelToken, CancelTokenSource } from "axios";
import { debounce } from "lodash";
import { useSnackbar } from "notistack";
import * as React from "react";
import { Link as RouterLink, useLocation, useNavigate } from "react-router-dom";
import { AuthContext } from "../Context";
import { Item } from "../items/Items";

export default () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { enqueueSnackbar, closeSnackbar } = useSnackbar();

  const [authContext] = React.useContext(AuthContext);

  const [cursor, setCursor] = React.useState<string | null>(null);
  const [order, setOrder] = React.useState<{
    by: string;
    direction: "asc" | "desc";
  }>({ by: "updatedAt", direction: "desc" });

  const [loading, setLoading] = React.useState(false);
  const cancelTokenSourceRef = React.useRef<CancelTokenSource | null>(null);

  const [count, setCount] = React.useState<number | null>(null);
  const [items, setItems] = React.useState<Item[]>([]);

  const [click, setClick] = React.useState<boolean>(false);

  function handleRefresh() {
    setClick(!click);
  }

  const queryItems = React.useMemo(
    () =>
      debounce(
        async (
          request: {
            order: {
              by: string;
              direction: string;
            };
          },
          startCallback: () => void,
          callback: (results: { count: number; results: Item[] }) => void,
          errorCallback: () => void,
          finallyCallback: () => void,
          cancelToken: CancelToken
        ) => {
          startCallback();
          await axios
            .get<{ count: number; results: Item[] }>(`/api/items/alerts`, {
              params: request,
              cancelToken: cancelToken,
            })
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
    []
  );

  React.useEffect(() => {
    if (cancelTokenSourceRef.current !== null) {
      cancelTokenSourceRef.current.cancel();
      cancelTokenSourceRef.current = null;
    }

    const cancelTokenSource = axios.CancelToken.source();
    queryItems(
      { order: order },
      () => {
        setCount(null);
        setItems([]);
        setLoading(true);
      },
      (data: { count: number; results: Item[] }) => {
        setCount(data.count);
        setItems(data.results);
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
  }, [queryItems, click, order]);

  async function handleLoadMoreClick() {
    setLoading(true);
    const source = axios.CancelToken.source();
    cancelTokenSourceRef.current = source;
    await axios
      .get<{ count: number; results: Item[] }>(`/api/items/alerts`, {
        params: {
          cursor: cursor,
        },
        cancelToken: source.token,
      })
      .then((result) => result.data)
      .then((data) => {
        setCount(data.count);
        const newItems = [...items, ...data.results];
        setItems(newItems);
        if (newItems.length === data.count) {
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
    return items.map((row: any) => (
      <TableRow
        key={row.name}
        sx={{ "&:last-child td, &:last-child th": { border: 0 } }}
      >
        <TableCell>
          <Tooltip title={row.id} placement="right">
            <Link
              underline="none"
              component={RouterLink}
              to={`/items/${row.id}`}
              color={"text.primary"}
            >
              <Typography fontFamily="monospace" variant="body2">
                {row.id.substring(0, 8)}
              </Typography>
            </Link>
          </Tooltip>
        </TableCell>
        <TableCell>{row.name}</TableCell>
        <TableCell align="right">
          <Typography fontFamily="monospace" variant="body2">
            {row.stock}
          </Typography>
        </TableCell>
        <TableCell align="right">
          <Typography fontFamily="monospace" variant="body2">
            {row.safetyStock}
          </Typography>
        </TableCell>
        <TableCell>{row.Unit.name}</TableCell>
        <TableCell>{row.Category.name}</TableCell>
      </TableRow>
    ));
  }, [items]);

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
          <Box display="flex" justifyContent="center" alignItems="center">
            <Typography variant="subtitle1" component="div">
              Item Alerts
            </Typography>
          </Box>
        </Stack>
        <Stack direction="row" spacing={2} sx={{ marginLeft: "auto" }}>
          {authContext?.user.admin && (
            <Box>
              <Button
                startIcon={<RefreshIcon />}
                variant="contained"
                onClick={handleRefresh}
              >
                Refresh
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
              <TableCell>ID</TableCell>
              <TableCell>
                <TableSortLabel
                  active={order.by === "name"}
                  direction={order.by === "name" ? order.direction : "asc"}
                  onClick={() => {
                    handleChangeSort({ by: "name", direction: "asc" });
                  }}
                >
                  Name
                </TableSortLabel>
              </TableCell>
              <TableCell align="right">Stock</TableCell>
              <TableCell align="right">Safety Stock</TableCell>
              <TableCell>
                <TableSortLabel
                  active={order.by === "unit"}
                  direction={order.by === "unit" ? order.direction : "asc"}
                  onClick={() => {
                    handleChangeSort({ by: "unit", direction: "asc" });
                  }}
                >
                  Unit
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
                  Category
                </TableSortLabel>
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {count !== null && (
              <TableRow>
                <TableCell
                  colSpan={6}
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
                    colSpan={6}
                    align="center"
                    sx={{ background: "rgba(0, 0, 0, 0.06)" }}
                  >
                    <Typography variant="button">Load More</Typography>
                  </TableCell>
                </TableRow>
              ))}
            {loading && (
              <TableRow>
                <TableCell colSpan={6} padding="none">
                  <LinearProgress />
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Stack>
  );
};

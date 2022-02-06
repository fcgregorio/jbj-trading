import { Edit as EditIcon } from "@mui/icons-material";
import { DateTimePicker } from "@mui/lab";
import {
  Autocomplete,
  Box,
  Breadcrumbs,
  Button,
  Divider,
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
import { DeleteDialogButton } from "../DeleteDialogButton";
import { RestoreDialogButton } from "../RestoreDialogButton";
import { Item, ItemHistory } from "./Items";

function History() {
  const location = useLocation();
  const navigate = useNavigate();
  const params = useParams();
  const { enqueueSnackbar, closeSnackbar } = useSnackbar();

  React.useEffect(() => {
    document.title = `Item ${params.itemID?.slice(0, 8)}`;
  }, []);

  const [loading, setLoading] = React.useState(false);
  const [cursor, setCursor] = React.useState<number | null>(null);
  const cancelTokenSourceRef = React.useRef<CancelTokenSource | null>(null);
  const [count, setCount] = React.useState<number | null>(null);
  const [itemHistories, setItemHistories] = React.useState<ItemHistory[]>([]);

  useAsyncEffect(
    async (isActive) => {
      setLoading(true);
      await axios
        .get<{ count: number; results: ItemHistory[] }>(
          `/api${location.pathname}/histories`
        )
        .then((result) => result.data)
        .then((data) => {
          setCount(data.count);
          setItemHistories(data.results);
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
      .get<{ count: number; results: ItemHistory[] }>(
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
        const newItemHistories = [...itemHistories, ...data.results];
        setItemHistories(newItemHistories);
        if (newItemHistories.length === data.count) {
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
        flex: "1 1 auto",
        overflowY: "scroll",
        minHeight: "360px",
      }}
    >
      <Table size="small" stickyHeader>
        <TableHead>
          <TableRow>
            <TableCell>History ID</TableCell>
            <TableCell>History User</TableCell>
            <TableCell>Name</TableCell>
            <TableCell align="right">Stock</TableCell>
            <TableCell align="right">Safety Stock</TableCell>
            <TableCell>Unit</TableCell>
            <TableCell>Category</TableCell>
            <TableCell>Remarks</TableCell>
            <TableCell align="right">Created At</TableCell>
            <TableCell align="right">Updated At</TableCell>
            <TableCell align="right">Deleted At</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {count !== null && (
            <TableRow>
              <TableCell
                colSpan={11}
                align="right"
                sx={{ background: "rgba(0, 0, 0, 0.06)" }}
              >
                <Typography fontFamily="monospace" variant="overline">
                  {count} {count === 1 ? "item" : "items"}
                </Typography>
              </TableCell>
            </TableRow>
          )}
          {itemHistories.map((row: any) => (
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
              <TableCell>{row.remarks}</TableCell>
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
              <TableCell align="right">
                {row.deletedAt !== null
                  ? DateTime.fromISO(row.deletedAt)
                      .toLocal()
                      .toLocaleString(DateTime.DATETIME_SHORT)
                  : null}
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
                  colSpan={11}
                  align="center"
                  sx={{ background: "rgba(0, 0, 0, 0.06)" }}
                >
                  <Typography variant="button">Load More</Typography>
                </TableCell>
              </TableRow>
            ))}
          {loading && (
            <TableRow>
              <TableCell colSpan={11} padding="none">
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
  const [item, setItem] = React.useState<Item | null>(null);

  useAsyncEffect(
    async (isActive) => {
      setLoading(true);
      await axios
        .get<Item>(`/api${location.pathname}`)
        .then((result) => result.data)
        .then((result) => {
          setItem(result);
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

  async function handleDestroyItem() {
    await axios
      .delete(`/api${location.pathname}`)
      .then((result) => result.data)
      .then((result) => {
        navigate("/", { replace: true });
        navigate(`../${params.itemID}`, { replace: true });
        enqueueSnackbar("Destroy item successful", { variant: "success" });
      })
      .catch((error) => {
        enqueueSnackbar("Destroy item failed", { variant: "error" });
      });
  }

  async function handleRestoreItem() {
    await axios
      .put(`/api${location.pathname}/restore`)
      .then((result) => result.data)
      .then((result) => {
        navigate("/", { replace: true });
        navigate(`../${params.itemID}`, { replace: true });
        enqueueSnackbar("Restore item successful", { variant: "success" });
      })
      .catch((error) => {
        enqueueSnackbar("Restore item failed", { variant: "error" });
      });
  }

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
                    Items
                  </Link>
                  <Typography color="text.primary">{params.itemID}</Typography>
                </Breadcrumbs>
              </Box>
            </Stack>
            {item !== null && (
              <Stack direction="row" spacing={2} sx={{ marginLeft: "auto" }}>
                {authContext?.user.admin &&
                  (item!.deletedAt === null ? (
                    <React.Fragment>
                      <DeleteDialogButton handleDelete={handleDestroyItem} />
                      <Button
                        startIcon={<EditIcon />}
                        variant="contained"
                        component={RouterLink}
                        to={`edit`}
                      >
                        Edit
                      </Button>
                    </React.Fragment>
                  ) : (
                    <RestoreDialogButton handleRestore={handleRestoreItem} />
                  ))}
              </Stack>
            )}
          </Box>
          {item !== null && (
            <React.Fragment>
              <Stack
                spacing={2}
                sx={{
                  paddingX: 2,
                }}
              >
                <TextField
                  margin="dense"
                  id="name"
                  label="Name"
                  type="text"
                  fullWidth
                  variant="filled"
                  value={item.name}
                  InputProps={{
                    readOnly: true,
                  }}
                />
                <TextField
                  margin="dense"
                  id="safetyStock"
                  label="Safety Stock"
                  type="number"
                  variant="filled"
                  fullWidth
                  value={item.safetyStock}
                  inputProps={{
                    inputMode: "numeric",
                    pattern: "[0-9]*",
                    min: "0",
                    step: "1",
                  }}
                  InputProps={{
                    readOnly: true,
                  }}
                />
                <TextField
                  margin="dense"
                  id="stock"
                  label="Stock"
                  type="number"
                  variant="filled"
                  fullWidth
                  value={item.stock}
                  inputProps={{
                    inputMode: "numeric",
                    pattern: "[0-9]*",
                    min: "0",
                    step: "1",
                  }}
                  InputProps={{
                    readOnly: true,
                  }}
                />
                <TextField
                  margin="dense"
                  id="remarks"
                  label="Remarks"
                  type="text"
                  fullWidth
                  multiline
                  variant="filled"
                  value={item.remarks}
                  InputProps={{
                    readOnly: true,
                  }}
                />
                <Autocomplete
                  id="unit"
                  fullWidth
                  getOptionLabel={(option) =>
                    typeof option === "string" ? option : option.name
                  }
                  filterOptions={(x) => x}
                  options={[]}
                  autoComplete
                  includeInputInList
                  filterSelectedOptions
                  value={item.Unit}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Unit"
                      variant="filled"
                      InputProps={{
                        readOnly: true,
                      }}
                    />
                  )}
                />
                <Autocomplete
                  id="category"
                  fullWidth
                  getOptionLabel={(option) =>
                    typeof option === "string" ? option : option.name
                  }
                  filterOptions={(x) => x}
                  options={[]}
                  autoComplete
                  includeInputInList
                  filterSelectedOptions
                  value={item.Category}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Category"
                      variant="filled"
                      InputProps={{
                        readOnly: true,
                      }}
                    />
                  )}
                />
                <DateTimePicker
                  label="Created At"
                  value={item.createdAt}
                  onChange={() => {}}
                  readOnly={true}
                  renderInput={(params) => (
                    <TextField {...params} fullWidth variant="filled" />
                  )}
                />
                <DateTimePicker
                  label="Updated At"
                  value={item.updatedAt}
                  onChange={() => {}}
                  readOnly={true}
                  renderInput={(params) => (
                    <TextField {...params} fullWidth variant="filled" />
                  )}
                />
                <DateTimePicker
                  label="Deleted At"
                  value={item.deletedAt}
                  onChange={() => {}}
                  readOnly={true}
                  renderInput={(params) => (
                    <TextField {...params} fullWidth variant="filled" />
                  )}
                />
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

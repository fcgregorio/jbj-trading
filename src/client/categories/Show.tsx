import { Edit as EditIcon } from "@mui/icons-material";
import { DateTimePicker } from "@mui/lab";
import {
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
import { Category, CategoryHistory } from "./Categories";

function History() {
  const location = useLocation();
  const navigate = useNavigate();
  const params = useParams();
  const { enqueueSnackbar, closeSnackbar } = useSnackbar();

  React.useEffect(() => {
    document.title = `Category ${params.categoryID?.slice(0, 8)}`;
  }, []);

  const [loading, setLoading] = React.useState(false);
  const [cursor, setCursor] = React.useState<number | null>(null);
  const cancelTokenSourceRef = React.useRef<CancelTokenSource | null>(null);
  const [count, setCount] = React.useState<number | null>(null);
  const [categoryHistories, setCategoryHistories] = React.useState<
    CategoryHistory[]
  >([]);

  useAsyncEffect(
    async (isActive) => {
      setLoading(true);
      await axios
        .get<{ count: number; results: CategoryHistory[] }>(
          `/api${location.pathname}/histories`
        )
        .then((result) => result.data)
        .then((data) => {
          setCount(data.count);
          setCategoryHistories(data.results);
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
      .get<{ count: number; results: CategoryHistory[] }>(
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
        const newCategoryHistories = [...categoryHistories, ...data.results];
        setCategoryHistories(newCategoryHistories);
        if (newCategoryHistories.length === data.count) {
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
        minHeight: "720px",
      }}
    >
      <Table size="small" stickyHeader>
        <TableHead>
          <TableRow>
            <TableCell>History ID</TableCell>
            <TableCell>History User</TableCell>
            <TableCell>Name</TableCell>
            <TableCell align="right">Updated At</TableCell>
            <TableCell align="right">Deleted At</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {count !== null && (
            <TableRow>
              <TableCell
                colSpan={5}
                align="right"
                sx={{ background: "rgba(0, 0, 0, 0.06)" }}
              >
                <Typography fontFamily="monospace" variant="overline">
                  {count} {count === 1 ? "item" : "items"}
                </Typography>
              </TableCell>
            </TableRow>
          )}
          {categoryHistories.map((row: any) => (
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
              <TableCell
                align="right"
                dangerouslySetInnerHTML={{
                  __html:
                    row.deletedAt !== null
                      ? DateTime.fromISO(row.deletedAt)
                          .toLocal()
                          .toFormat(
                            "ccc, LLL'&nbsp;'dd,'&nbsp;'yyyy, hh:mm:ss.SSS'&nbsp;'a"
                          )
                      : "",
                }}
              />
            </TableRow>
          ))}
          {loading ||
            (cursor && (
              <TableRow
                onClick={handleLoadMoreClick}
                sx={{ cursor: "pointer" }}
              >
                <TableCell
                  colSpan={5}
                  align="center"
                  sx={{ background: "rgba(0, 0, 0, 0.06)" }}
                >
                  <Typography variant="button">Load More</Typography>
                </TableCell>
              </TableRow>
            ))}
          {loading && (
            <TableRow>
              <TableCell colSpan={5} padding="none">
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
  const [category, setCategory] = React.useState<Category | null>(null);

  useAsyncEffect(
    async (isActive) => {
      setLoading(true);
      await axios
        .get<Category>(`/api${location.pathname}`)
        .then((result) => result.data)
        .then((data) => {
          setCategory(data);
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

  async function handleDestroyCategory() {
    await axios
      .delete(`/api${location.pathname}`)
      .then((result) => result.data)
      .then((result) => {
        navigate("/", { replace: true });
        navigate(`../${params.categoryID}`, { replace: true });
        enqueueSnackbar("Destroy category successful", { variant: "success" });
      })
      .catch((error) => {
        enqueueSnackbar("Destroy category failed", { variant: "error" });
      });
  }

  async function handleRestoreCategory() {
    await axios
      .put(`/api${location.pathname}/restore`)
      .then((result) => result.data)
      .then((result) => {
        navigate("/", { replace: true });
        navigate(`../${params.categoryID}`, { replace: true });
        enqueueSnackbar("Restore category successful", { variant: "success" });
      })
      .catch((error) => {
        enqueueSnackbar("Restore category failed", { variant: "error" });
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
                    Categories
                  </Link>
                  <Typography color="text.primary">
                    {params.categoryID}
                  </Typography>
                </Breadcrumbs>
              </Box>
            </Stack>
            {category !== null && (
              <Stack direction="row" spacing={2} sx={{ marginLeft: "auto" }}>
                {authContext?.user.admin &&
                  (category.deletedAt === null ? (
                    <React.Fragment>
                      <DeleteDialogButton
                        handleDelete={handleDestroyCategory}
                      />
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
                    <RestoreDialogButton
                      handleRestore={handleRestoreCategory}
                    />
                  ))}
              </Stack>
            )}
          </Box>
          {category !== null && (
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
                  value={category.name}
                  InputProps={{
                    readOnly: true,
                  }}
                />
                <DateTimePicker
                  label="Created At"
                  value={category.createdAt}
                  inputFormat={"ccc, LLL dd, yyyy, hh:mm:ss.SSS a"}
                  onChange={() => {}}
                  readOnly={true}
                  renderInput={(params) => (
                    <TextField {...params} fullWidth variant="filled" />
                  )}
                />
                <DateTimePicker
                  label="Updated At"
                  value={category.updatedAt}
                  inputFormat={"ccc, LLL dd, yyyy, hh:mm:ss.SSS a"}
                  onChange={() => {}}
                  readOnly={true}
                  renderInput={(params) => (
                    <TextField {...params} fullWidth variant="filled" />
                  )}
                />
                <DateTimePicker
                  label="Deleted At"
                  value={category!.deletedAt}
                  inputFormat={"ccc, LLL dd, yyyy, hh:mm:ss.SSS a"}
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

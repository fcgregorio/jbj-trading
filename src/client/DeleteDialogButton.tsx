import { Delete as DeleteIcon } from "@mui/icons-material";
import { LoadingButton } from "@mui/lab";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from "@mui/material";
import * as React from "react";

export interface DeleteDialogButtonProps {
  handleDelete: () => Promise<void>;
}

export function DeleteDialogButton(props: DeleteDialogButtonProps) {
  const [open, setOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(false);

  const handleClickOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    if (loading) {
      return;
    }

    setOpen(false);
  };

  return (
    <React.Fragment>
      <Button
        startIcon={<DeleteIcon />}
        variant="contained"
        color="error"
        onClick={handleClickOpen}
      >
        Delete
      </Button>
      <Dialog open={open} onClose={handleClose}>
        <DialogTitle>Delete</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button disabled={loading} onClick={handleClose}>
            No
          </Button>
          <LoadingButton
            autoFocus
            loading={loading}
            loadingPosition="start"
            startIcon={loading ? <DeleteIcon /> : null}
            onClick={async () => {
              setLoading(true);
              await props.handleDelete();
              setLoading(false);
              handleClose();
            }}
          >
            Yes
          </LoadingButton>
        </DialogActions>
      </Dialog>
    </React.Fragment>
  );
}

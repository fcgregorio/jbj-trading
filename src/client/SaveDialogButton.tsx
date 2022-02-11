import { Save as SaveIcon } from "@mui/icons-material";
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

export interface SaveDialogButtonProps {
  message: string;
  disabled: boolean;
  useDialog: boolean;
  handleSave: () => Promise<void>;
}

export default function (props: SaveDialogButtonProps) {
  const [open, setOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(false);

  return (
    <React.Fragment>
      <LoadingButton
        disabled={props.disabled}
        loading={!props.useDialog && loading}
        loadingPosition="start"
        startIcon={<SaveIcon />}
        variant="contained"
        onClick={async () => {
          if (props.useDialog) {
            setOpen(true);
          } else {
            setOpen(true);
            setLoading(true);
            await props.handleSave();
            setLoading(false);
            setOpen(false);
          }
        }}
      >
        Save
      </LoadingButton>
      <Dialog
        open={open}
        onClose={() => {
          if (loading) {
            return;
          }

          setOpen(false);
        }}
      >
        {props.useDialog && (
          <React.Fragment>
            <DialogTitle>Save</DialogTitle>
            <DialogContent>
              <DialogContentText>{props.message}</DialogContentText>
            </DialogContent>
            <DialogActions>
              <Button
                disabled={loading}
                onClick={() => {
                  setOpen(false);
                }}
              >
                No
              </Button>
              <LoadingButton
                autoFocus
                loading={loading}
                loadingPosition="start"
                startIcon={loading ? <SaveIcon /> : null}
                onClick={async () => {
                  setLoading(true);
                  await props.handleSave();
                  setLoading(false);
                  setOpen(false);
                }}
              >
                Yes
              </LoadingButton>
            </DialogActions>
          </React.Fragment>
        )}
      </Dialog>
    </React.Fragment>
  );
}

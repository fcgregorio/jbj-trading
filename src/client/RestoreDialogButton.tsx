import * as React from 'react';
import {
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle,
} from '@mui/material';
import RestoreFromTrashIcon from '@mui/icons-material/RestoreFromTrash';
import { LoadingButton } from '@mui/lab';


export interface RestoreDialogButtonProps {
    handleRestore: () => Promise<any>;
}

export function RestoreDialogButton(props: RestoreDialogButtonProps) {
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
                startIcon={<RestoreFromTrashIcon />}
                variant="contained"
                color='secondary'
                onClick={handleClickOpen}
            >
                Restore
            </Button>
            <Dialog
                open={open}
                onClose={handleClose}
            >
                <DialogTitle>
                    Restore
                </DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Are you sure you want to restore?
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button
                        disabled={loading}
                        onClick={handleClose}
                    >
                        No
                    </Button>
                    <LoadingButton
                        autoFocus
                        loading={loading}
                        loadingPosition="start"
                        startIcon={loading ? <RestoreFromTrashIcon /> : null}
                        onClick={async () => {
                            setLoading(true);
                            await props.handleRestore();
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
};
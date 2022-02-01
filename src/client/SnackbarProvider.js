import { SnackbarProvider } from 'notistack';
import { Fade } from '@mui/material';

export default (props) => (
    <SnackbarProvider maxSnack={3}
        anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'right',
        }}
        TransitionComponent={Fade}
    >
        {props.children}
    </SnackbarProvider>
);
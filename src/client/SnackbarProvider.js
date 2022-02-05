import { Fade } from "@mui/material";
import { SnackbarProvider } from "notistack";

export default (props) => (
  <SnackbarProvider
    maxSnack={3}
    anchorOrigin={{
      vertical: "bottom",
      horizontal: "right",
    }}
    TransitionComponent={Fade}
  >
    {props.children}
  </SnackbarProvider>
);

import { Stack } from "@mui/material";
import * as React from "react";

export default function Index() {
  React.useEffect(() => {
    document.title = `Unauthorized`;
  }, []);

  return (
    <Stack
      spacing={2}
      sx={{
        marginX: 2,
        marginY: 2,
      }}
    >
      Unauthorized
    </Stack>
  );
}

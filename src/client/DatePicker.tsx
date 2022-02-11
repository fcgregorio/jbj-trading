import { DesktopDatePicker } from "@mui/lab";
import { TextField } from '@mui/material';
import { DateTime } from "luxon";
import * as React from "react";
import { DateTimeContext } from "./Context";

export default function () {
  const [dateTimeContext, setDateTimeContext] =
    React.useContext(DateTimeContext);
  const datePickerInputRef = React.useRef<HTMLInputElement>(null);
  const [datePickerformat, setDatePickerFormat] =
    React.useState<string>("ccc, LLL dd, yyyy");

  return (
    <DesktopDatePicker
      inputRef={datePickerInputRef}
      label="Date"
      value={dateTimeContext}
      inputFormat={datePickerformat}
      minDate={DateTime.local(2000, 1, 1)}
      maxDate={DateTime.now()}
      onChange={(newValue) => {
        if (newValue === null) {
          newValue = DateTime.invalid("Cannot be null");
        }
        setDateTimeContext(newValue);
      }}
      onOpen={() => {
        setDatePickerFormat("LL/dd/yyyy");
      }}
      onClose={() => {
        setDatePickerFormat("ccc, LLL dd, yyyy");
      }}
      renderInput={(params) => (
        <TextField
          {...params}
          sx={{ width: 250 }}
          size="small"
          onFocusCapture={(event) => {
            if (event.target === datePickerInputRef.current) {
              setDatePickerFormat("LL/dd/yyyy");
            }
          }}
          onBlur={() => {
            setDatePickerFormat("ccc, LLL dd, yyyy");
          }}
        />
      )}
    />
  );
}

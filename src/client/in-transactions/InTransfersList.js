import DeleteIcon from '@mui/icons-material/Delete';
import {
    IconButton,
    TableCell,
    TableRow,
    TextField,
    Tooltip,
    Typography
} from '@mui/material';
import { FieldArray, FormikProvider, getIn } from "formik";
import * as React from "react";

export default function (props) {
    return (
        <FormikProvider value={props.formik}>
            <FieldArray
                name="InTransfers"
                render={(arrayHelpers) => (
                    <React.Fragment>
                        {props.formik.values.InTransfers.map((InTransfer, index) => (
                            <TableRow
                                key={InTransfer.item}
                                sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                            >
                                <TableCell>
                                    <Tooltip title={props.formik.values.InTransfers[index].item} placement="right">
                                        <Typography
                                            fontFamily='monospace'
                                            variant='body2'
                                        >
                                            {props.formik.values.InTransfers[index].item.substring(0, 8)}
                                        </Typography>
                                    </Tooltip>
                                </TableCell>
                                <TableCell>{props.formik.values.InTransfers[index].Item.name}</TableCell>
                                <TableCell align="right">
                                    <TextField
                                        id={`InTransfers[${index}].quantity`}
                                        autoFocus
                                        sx={{
                                            minWidth: 100
                                        }}
                                        fullWidth
                                        size='small'
                                        autoComplete="off"
                                        margin="dense"
                                        type="number"
                                        variant="outlined"
                                        value={props.formik.values.InTransfers[index].quantity}
                                        onChange={props.formik.handleChange}
                                        onBlur={props.formik.handleBlur}
                                        inputProps={{
                                            inputMode: 'numeric',
                                            pattern: '[0-9]*',
                                            min: "1",
                                            step: "1",
                                        }}
                                        error={
                                            props.formik.touched.InTransfers &&
                                            props.formik.touched.InTransfers[index] &&
                                            props.formik.touched.InTransfers[index].quantity &&
                                            Boolean(props.formik.errors.InTransfers) &&
                                            Boolean(props.formik.errors.InTransfers[index]) &&
                                            Boolean(props.formik.errors.InTransfers[index].quantity)
                                        }
                                        helperText={
                                            props.formik.touched.InTransfers &&
                                            props.formik.touched.InTransfers[index] &&
                                            props.formik.touched.InTransfers[index].quantity &&
                                            Boolean(props.formik.errors.InTransfers) &&
                                            Boolean(props.formik.errors.InTransfers[index]) &&
                                            Boolean(props.formik.errors.InTransfers[index].quantity) &&
                                            props.formik.errors.InTransfers[index].quantity
                                        }
                                    />
                                </TableCell>
                                <TableCell>{props.formik.values.InTransfers[index].Item.Unit.name}</TableCell>
                                <TableCell
                                    sx={{
                                        width: '1%',
                                    }}
                                >
                                    <IconButton
                                        size="small"
                                        onClick={() => arrayHelpers.remove(index)}
                                    >
                                        <DeleteIcon fontSize="inherit" />
                                    </IconButton>
                                </TableCell>
                            </TableRow>
                        ))}
                    </React.Fragment>
                )}
            />
        </FormikProvider>
    );
};
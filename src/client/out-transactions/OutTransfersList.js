import DeleteIcon from '@mui/icons-material/Delete';
import {
    IconButton,
    Link,
    TableCell,
    TableRow,
    TextField,
    Tooltip,
    Typography
} from '@mui/material';
import { FieldArray, FormikProvider, getIn } from "formik";
import * as React from "react";
import {
    Link as RouterLink
} from 'react-router-dom';

export default function (props) {
    return (
        <FormikProvider value={props.formik}>
            <FieldArray
                name="OutTransfers"
                render={(arrayHelpers) => (
                    <React.Fragment>
                        {props.formik.values.OutTransfers.map((OutTransfer, index) => (
                            <TableRow
                                key={OutTransfer.item}
                                sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                            >
                                <TableCell>
                                    <Tooltip title={props.formik.values.OutTransfers[index].item} placement="right">
                                        <Link
                                            underline="none"
                                            component={RouterLink}
                                            to={`/items/${props.formik.values.OutTransfers[index].item}`}
                                            color={'text.primary'}
                                        >
                                            <Typography
                                                fontFamily='monospace'
                                                variant='body2'
                                            >
                                                {props.formik.values.OutTransfers[index].item.substring(0, 8)}
                                            </Typography>
                                        </Link>
                                    </Tooltip>
                                </TableCell>
                                <TableCell>{props.formik.values.OutTransfers[index].Item.name}</TableCell>
                                <TableCell align="right">
                                    <TextField
                                        id={`OutTransfers[${index}].quantity`}
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
                                        value={props.formik.values.OutTransfers[index].quantity}
                                        onChange={props.formik.handleChange}
                                        onBlur={props.formik.handleBlur}
                                        inputProps={{
                                            inputMode: 'numeric',
                                            pattern: '[0-9]*',
                                            min: "1",
                                            step: "1",
                                        }}
                                        error={
                                            props.formik.touched.OutTransfers &&
                                            props.formik.touched.OutTransfers[index] &&
                                            props.formik.touched.OutTransfers[index].quantity &&
                                            Boolean(props.formik.errors.OutTransfers) &&
                                            Boolean(props.formik.errors.OutTransfers[index]) &&
                                            Boolean(props.formik.errors.OutTransfers[index].quantity)
                                        }
                                        helperText={
                                            props.formik.touched.OutTransfers &&
                                            props.formik.touched.OutTransfers[index] &&
                                            props.formik.touched.OutTransfers[index].quantity &&
                                            Boolean(props.formik.errors.OutTransfers) &&
                                            Boolean(props.formik.errors.OutTransfers[index]) &&
                                            Boolean(props.formik.errors.OutTransfers[index].quantity) &&
                                            props.formik.errors.OutTransfers[index].quantity
                                        }
                                    />
                                </TableCell>
                                <TableCell>{props.formik.values.OutTransfers[index].Item.Unit.name}</TableCell>
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
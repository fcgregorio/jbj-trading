import {
    Add as AddIcon,
    Search as SearchIcon
} from '@mui/icons-material';
import {
    Autocomplete,
    Box,
    Button,
    InputAdornment,
    Stack,
    TextField,
    Toolbar,
    Typography,
} from '@mui/material';
import { red } from '@mui/material/colors';
import axios, { CancelToken } from 'axios';
import { isSafeInteger } from 'lodash';
import throttle from 'lodash/throttle';
import { DateTime } from 'luxon';
import * as React from 'react';
import {
    Route,
    Routes,
} from 'react-router-dom';
import { AuthContext } from '../Context';
import Unauthorized from '../unauthorized/Index';
import Create from './Create';
import Edit from './Edit';
import Index from './Index';
import Show from './Show';

export interface OutTransaction {
    id: string;
    customer: string;
    deliveryReceipt: string | null;
    dateOfDeliveryReceipt: DateTime | null;
    void: boolean;
    createdAt: DateTime,
    updatedAt: DateTime,
    OutTransfers: OutTransfer[];
}

export interface CreateOutTransaction {
    customer: string;
    deliveryReceipt: string | null;
    dateOfDeliveryReceipt: DateTime | null;
    OutTransfers: OutTransfer[];
}

export interface ApiCreateOutTransaction {
    customer: string;
    deliveryReceipt: string | null;
    dateOfDeliveryReceipt: DateTime | null;
    outTransfers: OutTransfer[];
}

export interface EditOutTransaction {
    customer: string;
    deliveryReceipt: string | null;
    dateOfDeliveryReceipt: DateTime | null;
    void: boolean;
    disableVoid: boolean;
    createdAt: DateTime,
    updatedAt: DateTime,
    OutTransfers: OutTransfer[];
}

export interface ApiEditOutTransaction {
    customer: string;
    deliveryReceipt: string | null;
    dateOfDeliveryReceipt: DateTime | null;
    void: boolean;
}

export interface OutTransactionHistory extends OutTransaction {
    historyId: number;
    historyUser: string;
}

export interface OutTransfer {
    item: string;
    quantity: number | null;
    Item?: Item;
}

export interface Item {
    id?: string;
    name: string;
    Unit: Unit;
    Category?: Category;
}

export interface Unit {
    name: string;
}

export interface Category {
    name: string;
}

export interface OutTransferStripProps {
    outTransfers: OutTransfer[];
    handleSave: (outTransfer: OutTransfer) => void;
    handleBlur: () => void;
    hasError: boolean;
}

export function OutTransferStrip(props: OutTransferStripProps) {
    const [item, setItem] = React.useState<Readonly<Item> | null>(null);
    const [itemInputValue, setItemInputValue] = React.useState<string>('');
    const [itemOptions, setItemOptions] = React.useState<readonly Item[]>([]);
    const [quantity, setQuantity] = React.useState(1);
    const [outTransferIDs, setOutTransferIDs] = React.useState<readonly string[]>([]);

    const itemInputElRef = React.useRef<HTMLDivElement>(null);
    const quantityInputElRef = React.useRef<HTMLDivElement>(null);
    const addButtonElRef = React.useRef<HTMLButtonElement>(null);

    React.useEffect(() => {
        const outTransferIDs = props.outTransfers.map((outTransfer) => outTransfer.item);
        setOutTransferIDs(outTransferIDs);
    }, [props.outTransfers]);

    const queryItems = React.useMemo(
        () =>
            throttle(
                async (
                    request: { input: string; },
                    callback: (results: Item[]) => void,
                    cancelToken: CancelToken,
                ) => {
                    await axios.get<
                        { count: number; results: Item[]; }
                    >(
                        `/api/items`,
                        {
                            params: {
                                search: request.input,
                                filters: {
                                    showDeleted: false,
                                },
                            },
                            cancelToken: cancelToken,
                        })
                        .then(result => result.data)
                        .then(data => {
                            callback(data.results);
                        })
                        .catch(error => {

                        });
                },
                200,
            ),
        [],
    );

    React.useEffect(() => {
        const cancelTokenSource = axios.CancelToken.source();

        if (itemInputValue === '') {
            setItemOptions([]);
            return;
        }

        queryItems(
            { input: itemInputValue },
            (results: Item[]) => {
                let newOptions: Item[] = [];

                if (results) {
                    newOptions = results.filter(item => !outTransferIDs.includes(item.id!));
                }

                setItemOptions(newOptions);
            },
            cancelTokenSource.token,
        );

        return () => {
            cancelTokenSource.cancel();
        };
    }, [outTransferIDs, item, itemInputValue, queryItems]);

    function handleBlur(event: React.FocusEvent<any>) {
        if (event.relatedTarget === itemInputElRef.current ||
            event.relatedTarget === quantityInputElRef.current ||
            event.relatedTarget === addButtonElRef.current) {
            return;
        }
        props.handleBlur();
    }

    return (
        <Toolbar
            disableGutters
            sx={{
                px: '12px',
                backgroundColor: 'rgba(0, 0, 0, 0.06)',
                ":hover": {
                    backgroundColor: 'rgba(0, 0, 0, 0.09)',
                },
            }}
        >
            <Typography
                sx={{ flex: '1 1 auto' }}
                color={props.hasError ? red[700] : "text.secondary"}
                variant="subtitle1"
                component="div"
            >
                Out-Transfers**
            </Typography>
            <Box
                sx={{ marginLeft: 'auto' }}
            >
                <Stack
                    direction="row"
                    justifyContent="space-evenly"
                    alignItems="center"
                    spacing={2}
                >
                    <Autocomplete
                        sx={{
                            width: 300,
                            backgroundColor: 'white',
                        }}
                        id="item"
                        getOptionLabel={(option) =>
                            typeof option === 'string' ? option : option.name
                        }
                        filterOptions={(x) => x}
                        options={itemOptions}
                        autoComplete
                        includeInputInList
                        filterSelectedOptions
                        value={item}
                        onChange={(event: any, newValue: Item | null) => {
                            setItemOptions(newValue ? [newValue, ...itemOptions] : itemOptions);
                            setItem(newValue);
                        }}
                        onInputChange={(event, newInputValue) => {
                            setItemInputValue(newInputValue);
                        }}
                        renderInput={(params) => (
                            <TextField
                                {...params}
                                label="Item"
                                variant="outlined"
                                size='small'
                                inputRef={itemInputElRef}
                                onBlur={handleBlur}
                                InputProps={{
                                    ...params.InputProps,
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <SearchIcon />
                                        </InputAdornment>
                                    ),
                                }}
                            />
                        )}
                        renderOption={(props, option, state) => (
                            <li {...props}>
                                <Stack>
                                    <Typography
                                        variant="body2"
                                    >
                                        {option.name}
                                    </Typography>
                                    <Typography
                                        variant="caption"
                                        color="text.secondary"
                                    >
                                        {option.Unit.name} &bull; {option.Category!.name}
                                    </Typography>
                                </Stack>
                            </li>
                        )}
                    />
                    <TextField
                        inputRef={quantityInputElRef}
                        sx={{
                            width: 100,
                            backgroundColor: 'white',
                        }}
                        size='small'
                        autoComplete="off"
                        margin="dense"
                        id="quantity"
                        label="Quantity"
                        type="number"
                        variant="outlined"
                        value={quantity}
                        onChange={(event) => {
                            setQuantity(parseInt(event.target.value));
                        }}
                        onBlur={handleBlur}
                        inputProps={{
                            inputMode: 'numeric',
                            pattern: '[0-9]*',
                            min: "1",
                            step: "1",
                        }}
                    />
                    <Button
                        ref={addButtonElRef}
                        startIcon={<AddIcon />}
                        variant="contained"
                        disabled={item === null || (!isSafeInteger(quantity) || quantity === 0)}
                        onClick={() => {
                            props.handleSave({
                                item: item!.id!,
                                quantity: quantity,
                                Item: item!
                            });
                            setItem(null);
                            setItemInputValue('');
                            setItemOptions([]);
                            setQuantity(1);
                            setOutTransferIDs([]);
                        }}
                        onBlur={handleBlur}
                    >
                        Add
                    </Button>
                </Stack>
            </Box>
        </Toolbar >
    );
}

export default function OutTransaction() {
    const [authContext,] = React.useContext(AuthContext);

    return (
        <Routes>
            <Route
                path='/'
                element={<Index />}
            />
            <Route
                path='create'
                element={<Create />}
            />
            <Route
                path=':outTransactionID'
                element={<Show />}
            />
            <Route
                path=':outTransactionID/edit'
                element={
                    authContext?.user.admin ?
                        <Edit /> :
                        <Unauthorized />
                }
            />
        </Routes>
    );
};
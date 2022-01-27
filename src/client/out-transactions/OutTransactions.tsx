import AddIcon from '@mui/icons-material/Add';
import {
    Autocomplete,
    Button, Stack,
    TextField
} from '@mui/material';
import axios from 'axios';
import { isSafeInteger } from 'lodash';
import throttle from 'lodash/throttle';
import { DateTime } from 'luxon';
import * as React from 'react';
import {
    Route, Routes, useLocation
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
    quantity: number;
    Item?: Item;
}

export interface Item {
    id?: string;
    name: string;
    Unit: Unit;
}

export interface Unit {
    name: string;
}

export interface OutTransferStripProps {
    outTransfers: OutTransfer[];
    handleSave: (outTransfer: OutTransfer) => void;
    handleBlur: React.FocusEventHandler;
}

export function OutTransferStrip(props: OutTransferStripProps) {
    const [item, setItem] = React.useState<Readonly<Item> | null>(null);
    const [itemInputValue, setItemInputValue] = React.useState<string>('');
    const [itemOptions, setItemOptions] = React.useState<readonly Item[]>([]);
    const [quantity, setQuantity] = React.useState(0);
    const [outTransferIDs, setOutTransferIDs] = React.useState<readonly string[]>([]);

    React.useEffect(() => {
        const outTransferIDs = props.outTransfers.map((outTransfer) => outTransfer.item);
        setOutTransferIDs(outTransferIDs);
    }, [props.outTransfers]);

    const queryItems = React.useMemo(
        () =>
            throttle(
                (
                    request: { input: string; },
                    callback: (results?: readonly Item[]) => void,
                ) => {
                    axios.get<{ count: number; results: Item[]; }>(
                        `/api/items`,
                        {
                            params: {
                                search: request.input,
                                filters: {
                                    showDeleted: false,
                                },
                            },
                        },
                    )
                        .then(result => result.data)
                        .then(
                            (data) => {
                                callback(data.results);
                            },
                            // Note: it's important to handle errors here
                            // instead of a catch() block so that we don't swallow
                            // exceptions from actual bugs in components.
                            (error) => {

                            }
                        );
                },
                200,
            ),
        [],
    );

    React.useEffect(() => {
        if (itemInputValue === '') {
            setItemOptions([]);
            return undefined;
        }

        queryItems({ input: itemInputValue }, (results?: readonly Item[]) => {
            let newOptions: readonly Item[] = [];

            if (results) {
                newOptions = results.filter(item => !outTransferIDs.includes(item.id!));
            }

            setItemOptions(newOptions);
        });
    }, [outTransferIDs, item, itemInputValue, queryItems]);

    return (
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
                onBlur={props.handleBlur}
                renderInput={(params) => (
                    <TextField {...params} label="Item" variant="outlined" size='small' />
                )}
            />
            <TextField
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
                inputProps={{
                    inputMode: 'numeric',
                    pattern: '[0-9]*',
                    min: "0",
                    step: "1",
                }}
            />
            <Button
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
                    setQuantity(0);
                    setOutTransferIDs([]);
                }}
            >
                Add
            </Button>
        </Stack>
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
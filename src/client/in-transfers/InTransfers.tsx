import * as React from 'react';
import {
    Route,
    Routes,
} from 'react-router-dom';
import Index from './Index';

export interface InTransfer {
    item: string;
    transaction: string;
    quantity: number;
    Transaction: InTransaction;
    Item: Item;
    createdAt: Date;
    updatedAt: Date;
}

export interface InTransaction {
    id: string;
    supplier: string;
    void: boolean;
}

export interface Item {
    id: string;
    name: string;
    Unit: Unit;
}

export interface Unit {
    name: string;
}

export default function InTransaction() {
    return (
        <Routes>
            <Route
                path='/'
                element={<Index />}
            />
        </Routes>
    );
};
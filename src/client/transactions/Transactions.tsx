import * as React from 'react';
import {
    Route, Routes, useLocation
} from 'react-router-dom';
import Index from './Index';

export interface Transaction {
    id: string;
    inTransaction: string | null;
    outTransaction: string | null;
    InTransaction: InTransaction | null;
    OutTransaction: OutTransaction | null;
    createdAt: Date,
    updatedAt: Date,
}

export interface InTransaction {
    id: string;
    supplier: string;
    deliveryReceipt: string | null;
    dateOfDeliveryReceipt: Date | null;
    dateReceived: Date | null;
    void: boolean;
    createdAt: Date,
    updatedAt: Date,
}

export interface OutTransaction {
    id: string;
    customer: string;
    deliveryReceipt: string | null;
    dateOfDeliveryReceipt: Date | null;
    void: boolean;
    createdAt: Date,
    updatedAt: Date,
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
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

export interface Unit {
    id: string;
    name: string;
    createdAt: DateTime,
    updatedAt: DateTime,
    deletedAt: DateTime | null,
}

export interface CreateUnit {
    name: string;
}

export interface ApiCreateUnit {
    name: string;
}

export interface EditUnit {
    name: string;
    createdAt: DateTime,
    updatedAt: DateTime,
    deletedAt: DateTime | null,
}

export interface ApiEditUnit {
    name: string;
}

export interface UnitHistory extends Unit {
    historyId: number;
    historyUser: string;
}

export default function Units() {
    const [authContext,] = React.useContext(AuthContext);

    return (
        <Routes>
            <Route
                path='/'
                element={<Index />}
            />
            <Route
                path='create'
                element={
                    authContext?.user.admin ?
                        <Create /> :
                        <Unauthorized />
                }
            />
            <Route
                path=':unitID'
                element={<Show />}
            />
            <Route
                path=':unitID/edit'
                element={
                    authContext?.user.admin ?
                        <Edit /> :
                        <Unauthorized />
                }
            />
        </Routes>
    );
};
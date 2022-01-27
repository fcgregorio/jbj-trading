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

export interface Category {
    id: string;
    name: string;
    createdAt: DateTime,
    updatedAt: DateTime,
    deletedAt: DateTime | null,
}

export interface CreateCategory {
    name: string;
}

export interface ApiCreateCategory {
    name: string;
}

export interface EditCategory {
    name: string;
    createdAt: DateTime,
    updatedAt: DateTime,
    deletedAt: DateTime | null,
}

export interface ApiEditCategory {
    name: string;
}

export interface CategoryHistory extends Category {
    historyId: number;
    historyUser: string;
}

export default function Categories() {
    const [authContext,] = React.useContext(AuthContext);

    return (
        <Routes>
            <Route
                path='/'
                element={<Index />}
            />
            <Route path='create'
                element={
                    authContext?.user.admin ?
                        <Create /> :
                        <Unauthorized />
                }
            />
            <Route path=':categoryID'
                element={<Show />}
            />
            <Route path=':categoryID/edit'
                element={
                    authContext?.user.admin ?
                        <Edit /> :
                        <Unauthorized />
                }
            />
        </Routes>
    );
};
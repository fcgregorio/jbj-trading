import * as React from 'react';
import {
    Route,
    Routes,
} from 'react-router-dom';
import { AuthContext } from '../Context';
import Create from './Create';
import Edit from './Edit';
import Index from './Index';
import Show from './Show';
import ChangePassword from './ChangePassword';
import Unauthorized from '../unauthorized/Index';
import { DateTime } from 'luxon';

export interface User {
    id: string;
    username: string;
    firstName: string;
    lastName: string;
    admin: boolean;
    createdAt: DateTime,
    updatedAt: DateTime,
    deletedAt: DateTime | null,
}

export interface CreateUser {
    username: string;
    firstName: string;
    lastName: string;
    password: string;
    passwordVerification: string;
    admin: boolean;
}

export interface ApiCreateUser {
    username: string;
    firstName: string;
    lastName: string;
    password: string;
    admin: boolean;
}

export interface EditUser {
    username: string;
    firstName: string;
    lastName: string;
    admin: boolean;
    createdAt: DateTime,
    updatedAt: DateTime,
    deletedAt: DateTime | null,
}

export interface ApiEditUser {
    username: string;
    firstName: string;
    lastName: string;
    admin: boolean;
}

export interface ChangePasswordUser {
    username: string;
    firstName: string;
    lastName: string;
    admin: boolean;
    password: string;
    passwordVerification: string;
    createdAt: DateTime,
    updatedAt: DateTime,
    deletedAt: DateTime | null,
}

export interface ApiChangePasswordUser {
    password: string;
}

export interface UserHistory extends User {
    historyId: number;
    historyUser: string;
}

export default function Users() {
    const [authContext,] = React.useContext(AuthContext);

    return (
        <Routes>
            <Route
                path='/'
                element={
                    authContext?.user.admin ?
                        <Index /> :
                        <Unauthorized />
                }
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
                path=':userID'
                element={
                    authContext?.user.admin ?
                        <Show /> :
                        <Unauthorized />
                }
            />
            <Route
                path=':userID/edit'
                element={
                    authContext?.user.admin ?
                        <Edit /> :
                        <Unauthorized />
                }
            />
            <Route
                path=':userID/change-password'
                element={
                    authContext?.user.admin ?
                        <ChangePassword /> :
                        <Unauthorized />
                }
            />
        </Routes>
    );
};
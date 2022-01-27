import DateAdapter from '@mui/lab/AdapterLuxon';
import LocalizationProvider from '@mui/lab/LocalizationProvider';
import CssBaseline from '@mui/material/CssBaseline';
import axios from 'axios';
import * as React from 'react';
import {
    Route, useNavigate, Routes,
    useLocation,
} from "react-router-dom";
import './App.css';
import { AuthContext } from './Context';
import Login from './login/Index';
import { User } from './models';
import Home from './home/Index';
import Categories from './categories/Categories';
import InTransactions from './in-transactions/InTransactions';
import InTransfers from './in-transfers/InTransfers';
import Items from './items/Items';
import OutTransactions from './out-transactions/OutTransactions';
import OutTransfers from './out-transfers/OutTransfers';
import Transactions from './transactions/Transactions';
import Transfers from './transfers/Transfers';
import Units from './units/Units';
import Users from './users/Users';
import { Fade } from '@mui/material';
import { SnackbarProvider } from 'notistack';

// https://usehooks.com/useLocalStorage
function useLocalStorage<T>(key: string, initialValue: T) {

    const [storedValue, setStoredValue] = React.useState<T | null>(() => {
        try {
            const item = window.localStorage.getItem(key);
            return item ? JSON.parse(item) : initialValue;
        } catch (error) {
            return initialValue;
        }
    });

    React.useEffect(() => {
        const item = window.localStorage.getItem(key);
        const stringified = JSON.stringify(storedValue);

        if (item !== stringified) {
            window.localStorage.setItem(key, stringified);
        }
    }, [key, storedValue]);

    React.useEffect(() => {
        function checkUserData() {
            try {
                const item = window.localStorage.getItem(key);
                if (item !== null) {
                    setStoredValue(JSON.parse(item));
                }
            } catch (error) {
                setStoredValue(null);
            }
        }

        window.addEventListener('storage', checkUserData);

        return () => {
            window.removeEventListener('storage', checkUserData);
        };
    }, [key]);

    return [storedValue, setStoredValue] as const;
}

function App() {
    const [authContext, setAuthContext] = useLocalStorage<{ user: User, token: string; } | null>("authContext", null);

    if (authContext !== null) {
        (axios.defaults.headers as any).common['Authorization'] = `Bearer ${authContext.token}`;
    } else {
        delete (axios.defaults.headers as any).common['Authorization'];
    }

    React.useEffect(() => {
        if (authContext !== null) {
            (axios.defaults.headers as any).common['Authorization'] = `Bearer ${authContext.token}`;
        } else {
            delete (axios.defaults.headers as any).common['Authorization'];
        }
    }, [authContext]);

    return (
        <AuthContext.Provider value={[authContext, setAuthContext]}>
            <LocalizationProvider dateAdapter={DateAdapter}>
                {/* <SnackbarProvider
                    maxSnack={3}
                    anchorOrigin={{
                        vertical: 'bottom',
                        horizontal: 'right',
                    }}
                // TransitionComponent={Fade}
                > */}
                    <CssBaseline />
                    <Routes>
                        <Route
                            path='/login'
                            element={<Login />}
                        />
                        <Route
                            element={<Home />}
                        >
                            <Route
                                path='transactions/*'
                                element={<Transactions />}
                            />
                            <Route
                                path='in-transactions/*'
                                element={<InTransactions />}
                            />
                            <Route
                                path='out-transactions/*'
                                element={<OutTransactions />}
                            />
                            <Route
                                path='transfers/*'
                                element={<Transfers />}
                            />
                            <Route
                                path='in-transfers/*'
                                element={<InTransfers />}
                            />
                            <Route
                                path='out-transfers/*'
                                element={<OutTransfers />}
                            />
                            <Route
                                path='items/*'
                                element={<Items />}
                            />
                            <Route
                                path='units/*'
                                element={<Units />}
                            />
                            <Route
                                path='categories/*'
                                element={<Categories />}
                            />
                            <Route
                                path='users/*'
                                element={<Users />}
                            />
                            <Route
                                index
                            />
                        </Route>
                    </Routes>
                {/* </SnackbarProvider> */}
            </LocalizationProvider >
        </AuthContext.Provider>
    );
}

export default App;
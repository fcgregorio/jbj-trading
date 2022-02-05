import { LocalizationProvider } from "@mui/lab";
import AdapterLuxon from "@mui/lab/AdapterLuxon";
import { CssBaseline } from "@mui/material";
import axios from "axios";
import * as React from "react";
import { Route, Routes } from "react-router-dom";
import "./App.css";
import Categories from "./categories/Categories";
import { AuthContext } from "./Context";
import Dashboard from "./dashboard/Index";
import InTransactions from "./in-transactions/InTransactions";
import InTransfers from "./in-transfers/InTransfers";
import Items from "./items/Items";
import Login from "./login/Index";
import Main from "./main/Index";
import { User } from "./models";
import OutTransactions from "./out-transactions/OutTransactions";
import OutTransfers from "./out-transfers/OutTransfers";
import SnackbarProvider from "./SnackbarProvider";
import Transactions from "./transactions/Transactions";
import Transfers from "./transfers/Transfers";
import Units from "./units/Units";
import Users from "./users/Users";

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

    window.addEventListener("storage", checkUserData);

    return () => {
      window.removeEventListener("storage", checkUserData);
    };
  }, [key]);

  return [storedValue, setStoredValue] as const;
}

function App() {
  const [authContext, setAuthContext] = useLocalStorage<{
    user: User;
    token: string;
  } | null>("authContext", null);

  if (authContext !== null) {
    (axios.defaults.headers as any).common[
      "Authorization"
    ] = `Bearer ${authContext.token}`;
  } else {
    delete (axios.defaults.headers as any).common["Authorization"];
  }

  React.useEffect(() => {
    if (authContext !== null) {
      (axios.defaults.headers as any).common[
        "Authorization"
      ] = `Bearer ${authContext.token}`;
    } else {
      delete (axios.defaults.headers as any).common["Authorization"];
    }
  }, [authContext]);

  return (
    <AuthContext.Provider value={[authContext, setAuthContext]}>
      <LocalizationProvider dateAdapter={AdapterLuxon}>
        <SnackbarProvider>
          <CssBaseline />
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route element={<Main />}>
              <Route path="dashboard/*" element={<Dashboard />} />
              <Route path="transactions/*" element={<Transactions />} />
              <Route path="in-transactions/*" element={<InTransactions />} />
              <Route path="out-transactions/*" element={<OutTransactions />} />
              <Route path="transfers/*" element={<Transfers />} />
              <Route path="in-transfers/*" element={<InTransfers />} />
              <Route path="out-transfers/*" element={<OutTransfers />} />
              <Route path="items/*" element={<Items />} />
              <Route path="units/*" element={<Units />} />
              <Route path="categories/*" element={<Categories />} />
              <Route path="users/*" element={<Users />} />
              <Route index />
            </Route>
          </Routes>
        </SnackbarProvider>
      </LocalizationProvider>
    </AuthContext.Provider>
  );
}

export default App;

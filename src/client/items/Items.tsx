import { DateTime } from "luxon";
import * as React from "react";
import { Route, Routes } from "react-router-dom";
import { AuthContext } from "../Context";
import Unauthorized from "../unauthorized/Index";
import Create from "./Create";
import Edit from "./Edit";
import Index from "./Index";
import Show from "./Show";

export interface Item {
  id: string;
  name: string;
  safetyStock: number;
  stock: number;
  remarks: string | null;
  unit: string;
  category: string;
  createdAt: DateTime;
  updatedAt: DateTime;
  deletedAt: DateTime | null;
  Unit: Unit;
  Category: Category;
}

export interface CreateItem {
  name: string;
  safetyStock: number;
  stock: number;
  remarks: string | null;
  Unit: Unit | null;
  Category: Category | null;
}

export interface ApiCreateItem {
  name: string;
  safetyStock: number;
  stock: number;
  remarks: string | null;
  unit: string;
  category: string;
}

export interface EditItem {
  name: string;
  safetyStock: number;
  stock: number;
  remarks: string | null;
  createdAt: DateTime;
  updatedAt: DateTime;
  deletedAt: DateTime | null;
  Unit: Unit | null;
  Category: Category | null;
}

export interface ApiEditItem {
  name: string;
  safetyStock: number;
  stock: number;
  remarks: string | null;
  unit: string;
  category: string;
}

export interface ItemHistory {
  historyId: number;
  historyUser: string;
  id: string;
  name: string;
  safetyStock: number;
  stock: number;
  remarks: string;
  unit: number;
  category: number;
  createdAt: DateTime;
  updatedAt: DateTime;
  deletedAt: DateTime | null;
  Unit: Unit;
  Category: Category;
}

export interface Unit {
  id?: string;
  name: string;
}

export interface Category {
  id?: string;
  name: string;
}

export default function Items() {
  const [authContext] = React.useContext(AuthContext);

  return (
    <Routes>
      <Route path="/" element={<Index />} />
      <Route
        path="create"
        element={authContext?.user.admin ? <Create /> : <Unauthorized />}
      />
      <Route path=":itemID" element={<Show />} />
      <Route
        path=":itemID/edit"
        element={authContext?.user.admin ? <Edit /> : <Unauthorized />}
      />
    </Routes>
  );
}

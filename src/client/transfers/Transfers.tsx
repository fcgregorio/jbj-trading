import * as React from "react";
import { Route, Routes, useLocation } from "react-router-dom";
import Index from "./Index";

export interface Transfer {
  id: string;
  type: string;
  item: string;
  transaction: string;
  quantity: number;
  Transaction: Transaction;
  Item: Item;
  createdAt: Date;
  updatedAt: Date;
}

export interface Transaction {
  id: string;
  customer?: string;
  supplier?: string;
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

export default function OutTransaction() {
  const location = useLocation();

  return (
    <Routes>
      <Route path="/" element={<Index />} />
    </Routes>
  );
}

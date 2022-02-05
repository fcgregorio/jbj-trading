import * as React from "react";
import { Route, Routes } from "react-router-dom";
import Index from "./Index";

export interface OutTransfer {
  id: string;
  item: string;
  transaction: string;
  quantity: number;
  Transaction: OutTransaction;
  Item: Item;
  createdAt: Date;
  updatedAt: Date;
}

export interface OutTransaction {
  id: string;
  customer: string;
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
  return (
    <Routes>
      <Route path="/" element={<Index />} />
    </Routes>
  );
}

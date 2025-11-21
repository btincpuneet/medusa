import { defineRouteConfig } from "@medusajs/admin-sdk"
import React from "react"
import { Navigate, Route, Routes } from "react-router-dom"

import ProductDetails from "./ProductDetails"
import ProductForm from "./ProductForm"
import ProductListPage from "./ProductListPage"

const ProductsRouter: React.FC = () => {
  return (
    <Routes>
      <Route index element={<ProductListPage />} />
      <Route path="new" element={<ProductForm mode="create" />} />
      <Route path=":id" element={<ProductDetails />} />
      <Route path=":id/edit" element={<ProductForm mode="edit" />} />
      <Route path="*" element={<Navigate to="/redington-products" replace />} />
    </Routes>
  )
}

export const config = defineRouteConfig({
  label: "Redington Products",
})

export default ProductsRouter

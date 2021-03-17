import React from "react";
import { Navigate, Outlet } from "react-router-dom";

import {
  AlertCircle as AlertCircleIcon,
  BarChart as BarChartIcon,
  Lock as LockIcon,
  Settings as SettingsIcon,
  ShoppingBag as ShoppingBagIcon,
  User as UserIcon,
  UserPlus as UserPlusIcon,
  Users as UsersIcon,
} from "react-feather";

import DashboardLayout from "src/layouts/DashboardLayout";
import MainLayout from "src/layouts/MainLayout";
import AccountView from "src/views/account/AccountView";
import CustomerListView from "src/views/customer/CustomerListView";
import DashboardView from "src/views/reports/DashboardView";
import LoginView from "src/views/auth/LoginView";
import NotFoundView from "src/views/errors/NotFoundView";
import ProductListView from "src/views/product/ProductListView";
import RegisterView from "src/views/auth/RegisterView";
import SettingsView from "src/views/settings/SettingsView";

import StockListView from "src/views/stock/StockListView";
import StockDetailView from "src/views/stock/StockDetailView";
import NavView from "src/views/stock/NavView";
import BalanceView from "src/views/stock/BalanceView";
import IncomeView from "src/views/stock/IncomeView";
import CashFlowView from "src/views/stock/CashFlowView";
import DCFView from "src/views/stock/DCFView";
import ValuationRatiosView from "src/views/stock/ValuationRatiosView";
import StockHistoricalView from "src/views/stock/StockHistoricalView";
import DupontView from "src/views/stock/DupontView";
import PriceView from "src/views/stock/PriceView";
import StockSummaryView from "src/views/stock/StockSummaryView";
import DailyReturnView from "src/views/stock/DailyReturnView";
import OvernightReturnView from "src/views/stock/OvernightReturnView";
import TechIndicatorView from "src/views/stock/TechIndicatorView";

const items = [
  {
    href: "/app/stocks",
    icon: BarChartIcon,
    title: "Stocks",
  },
  {
    href: "/app/dashboard",
    icon: BarChartIcon,
    title: "Dashboard",
  },
  {
    href: "/app/customers",
    icon: UsersIcon,
    title: "Customers",
  },
  {
    href: "/app/products",
    icon: ShoppingBagIcon,
    title: "Products",
  },
  {
    href: "/app/account",
    icon: UserIcon,
    title: "Account",
  },
  {
    href: "/app/settings",
    icon: SettingsIcon,
    title: "Settings",
  },
  {
    href: "/login",
    icon: LockIcon,
    title: "Login",
  },
  {
    href: "/register",
    icon: UserPlusIcon,
    title: "Register",
  },
  {
    href: "/404",
    icon: AlertCircleIcon,
    title: "Error",
  },
];

const routes = [
  {
    path: "app",
    element: <DashboardLayout sideNavs={items} />,
    children: [
      { path: "stocks", element: <StockListView /> },
      {
        path: "stocks/:id",
        element: <StockDetailView />,
        children: [
          { path: "summary", element: <StockSummaryView /> },
          { path: "nav", element: <NavView /> },
          { path: "balance", element: <BalanceView /> },
          { path: "income", element: <IncomeView /> },
          { path: "cash", element: <CashFlowView /> },
          { path: "dcf", element: <DCFView /> },
          { path: "ratios", element: <ValuationRatiosView /> },
          { path: "dupont", element: <DupontView /> },
          {
            path: "historical",
            element: <StockHistoricalView />,
            children: [
              { path: "price", element: <PriceView /> },
              { path: "return/daily", element: <DailyReturnView /> },
              { path: "return/overnight", element: <OvernightReturnView /> },
              { path: "indicator/:type", element: <TechIndicatorView /> },
            ],
          },
        ],
      },
      { path: "account", element: <AccountView /> },
      { path: "customers", element: <CustomerListView /> },
      { path: "dashboard", element: <DashboardView /> },
      { path: "products", element: <ProductListView /> },
      { path: "settings", element: <SettingsView /> },
      { path: "*", element: <Navigate to="/404" /> },
    ],
  },
  {
    path: "/",
    element: <MainLayout />,
    children: [
      { path: "login", element: <LoginView /> },
      { path: "register", element: <RegisterView /> },
      { path: "404", element: <NotFoundView /> },
      { path: "/", element: <Navigate to="/app/dashboard" /> },
      { path: "*", element: <Navigate to="/404" /> },
    ],
  },
];

export default routes;

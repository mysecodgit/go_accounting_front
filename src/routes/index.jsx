import React from "react";
import { Navigate } from "react-router-dom";

// // Profile
import UserProfile from "../pages/Authentication/user-profile";

// // Authentication related pages
import Login from "../pages/Authentication/Login";
import Logout from "../pages/Authentication/Logout";
import Register from "../pages/Authentication/Register";
import ForgetPwd from "../pages/Authentication/ForgetPassword";

// // Buildings List (after login)
import BuildingsList from "../pages/BuildingsList";

// // Dashboard
import Dashboard from "../pages/Dashboard/index";
import Vendors from "../pages/Vendors";
import Customers from "../pages/Customers";
import Buildings from "../pages/Buildings";
import Units from "../pages/Units";
import PeopleTypes from "../pages/PeopleTypes";
import People from "../pages/People";
import Periods from "../pages/Periods";
import AccountTypes from "../pages/AccountTypes";
import Accounts from "../pages/Accounts";
import Items from "../pages/Items";
import Invoices from "../pages/Invoices";
import InvoicePayments from "../pages/InvoicePayments";
import SalesReceipts from "../pages/SalesReceipts";
import Users from "../pages/Users";
import BalanceSheet from "../pages/Reports/BalanceSheet";
import TrialBalance from "../pages/Reports/TrialBalance";
import CustomerReport from "../pages/Reports/CustomerReport";
import VendorReport from "../pages/Reports/VendorReport";

const authProtectedRoutes = [
  // Buildings list page (first page after login)
  { path: "/buildings-list", component: <BuildingsList /> },

  // Building-scoped routes
  { path: "/building/:id/dashboard", component: <Dashboard /> },
  { path: "/building/:id/units", component: <Units /> },
  { path: "/building/:id/people-types", component: <PeopleTypes /> },
  { path: "/building/:id/people", component: <People /> },
  { path: "/building/:id/periods", component: <Periods /> },
  { path: "/building/:id/account-types", component: <AccountTypes /> },
  { path: "/building/:id/accounts", component: <Accounts /> },
  { path: "/building/:id/items", component: <Items /> },
  { path: "/building/:id/invoices", component: <Invoices /> },
  { path: "/building/:id/invoice-payments", component: <InvoicePayments /> },
  { path: "/building/:id/sales-receipts", component: <SalesReceipts /> },
  { path: "/building/:id/reports/balance-sheet", component: <BalanceSheet /> },
  { path: "/building/:id/reports/trial-balance", component: <TrialBalance /> },
  { path: "/building/:id/reports/customers", component: <CustomerReport /> },
  { path: "/building/:id/reports/vendors", component: <VendorReport /> },
  { path: "/building/:id/buildings", component: <Buildings /> },

  //profile
  { path: "/profile", component: <UserProfile /> },
  
  // Legacy routes (keeping for backward compatibility)
  { path: "/dashboard", component: <Dashboard /> },
  { path: "/buildings", component: <Buildings /> },
  { path: "/units", component: <Units /> },
  { path: "/people-types", component: <PeopleTypes /> },
  { path: "/people", component: <People /> },
  { path: "/periods", component: <Periods /> },
  { path: "/account-types", component: <AccountTypes /> },
  { path: "/accounts", component: <Accounts /> },
  { path: "/items", component: <Items /> },
  { path: "/invoices", component: <Invoices /> },
  { path: "/invoice-payments", component: <InvoicePayments /> },
  { path: "/sales-receipts", component: <SalesReceipts /> },
  { path: "/users", component: <Users /> },
  
  // Legacy routes
  { path: "/vendors", component: <Vendors /> },
  { path: "/customers", component: <Customers /> },

  // this route should be at the end of all other routes
  // eslint-disable-next-line react/display-name
  { path: "/", exact: true, component: <Navigate to="/buildings-list" /> },
];

const publicRoutes = [
  { path: "/logout", component: <Logout /> },
  { path: "/login", component: <Login /> },
  { path: "/forgot-password", component: <ForgetPwd /> },
  { path: "/register", component: <Register /> },
];

export { authProtectedRoutes, publicRoutes };

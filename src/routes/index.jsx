import React from "react";
import { Navigate } from "react-router-dom";

// // Profile
import UserProfile from "../pages/Authentication/user-profile";

// // Authentication related pages
import Login from "../pages/Authentication/Login";
import Logout from "../pages/Authentication/Logout";
import Register from "../pages/Authentication/Register";
import ForgetPwd from "../pages/Authentication/ForgetPassword";

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
import Users from "../pages/Users";

const authProtectedRoutes = [
  { path: "/dashboard", component: <Dashboard /> },

  //profile
  { path: "/profile", component: <UserProfile /> },
  
  // Modules
  { path: "/buildings", component: <Buildings /> },
  { path: "/units", component: <Units /> },
  { path: "/people-types", component: <PeopleTypes /> },
  { path: "/people", component: <People /> },
  { path: "/periods", component: <Periods /> },
  { path: "/account-types", component: <AccountTypes /> },
  { path: "/accounts", component: <Accounts /> },
  { path: "/users", component: <Users /> },
  
  // Legacy routes
  { path: "/vendors", component: <Vendors /> },
  { path: "/customers", component: <Customers /> },

  // this route should be at the end of all other routes
  // eslint-disable-next-line react/display-name
  { path: "/", exact: true, component: <Navigate to="/dashboard" /> },
];

const publicRoutes = [
  { path: "/logout", component: <Logout /> },
  { path: "/login", component: <Login /> },
  { path: "/forgot-password", component: <ForgetPwd /> },
  { path: "/register", component: <Register /> },
];

export { authProtectedRoutes, publicRoutes };

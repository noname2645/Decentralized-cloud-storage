import React, { useEffect } from 'react'; // Import useEffect
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import Home from './components/home';
import Login from './components/login';
import Register from './components/register';
import DecentralizedCloudStorage from './components/LandingPage';
import Features from './components/Features';
import ForgotPassword from './components/forgotpass';


// Create a router with defined routes
const router = createBrowserRouter([
  {
    path: "/",
    element: <DecentralizedCloudStorage />, 
  },
  {
    path: "/register",
    element: <Register />, 
  },
  {
    path: "/home",
    element: <Home />, 
  },
  {
    path: "/login",
    element: <Login />, 
  },
  {
    path: "/features",
    element: <Features />, 
  },
  {
    path: "/forgotpass",
    element: <ForgotPassword />, 
  }
]);

const App = () => {

  return (
    // Wrap your app in RouterProvider to handle routing
    <RouterProvider router={router} />
  );
};

export default App;

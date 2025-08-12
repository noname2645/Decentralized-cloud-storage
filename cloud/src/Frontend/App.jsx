import React, { useEffect } from 'react'; // Import useEffect
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import Home from '../Frontend/components/home.jsx';
import Login from '../Frontend/components/login.jsx';
import Register from '../Frontend/components/register.jsx';
import DecentralizedCloudStorage from '../Frontend/components/LandingPage.jsx';
import Features from '../Frontend/components/Features.jsx';
import ForgotPassword from '../Frontend/components/forgotpass.jsx';


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

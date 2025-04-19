import React, { useEffect } from 'react'; // Import useEffect
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import Home from './components/home';
import Login from './components/login';
import Register from './components/register';

// Create a router with defined routes
const router = createBrowserRouter([
  {
    path: "/",
    element: <Register />, // Register page for the root path
  },
  {
    path: "/home",
    element: <Home />, // Home page for the '/home' path
  },
  {
    path: "/login",
    element: <Login />, // Login page
  }
]);

const App = () => {
  useEffect(() => {
    const preventRightClick = (e) => {
      e.preventDefault();
    };

    // Attach the event listener to the whole document
    document.addEventListener('contextmenu', preventRightClick);

    // Clean up the event listener when the component unmounts
    return () => {
      document.removeEventListener('contextmenu', preventRightClick);
    };
  }, []); // Empty dependency array ensures this only runs on mount/unmount

  return (
    // Wrap your app in RouterProvider to handle routing
    <RouterProvider router={router} />
  );
};

export default App;

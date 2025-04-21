import React, { useEffect } from 'react'; // Import useEffect
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import Home from './components/home';
import Login from './components/login';
import Register from './components/register';
import DecentralizedCloudStorage from './components/LandingPage';
import Features from './components/Features';
import Aboutus from './components/AboutUs';
import Casestudy from './components/CaseStudy';
import Documentation from './components/Documentation';



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
    path: "/case",
    element: <Casestudy />, 
  },
  {
    path: "/aboutus",
    element: <Aboutus />, 
  },
  {
    path: "/doc",
    element: <Documentation />, 
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

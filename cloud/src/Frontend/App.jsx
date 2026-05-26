import React, { Suspense } from 'react';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';

// Lazy-load route components for code splitting
// Only the current page's code is downloaded, not all 6 pages at once
const Home = React.lazy(() => import('../Frontend/components/home.jsx'));
const Login = React.lazy(() => import('../Frontend/components/login.jsx'));
const Register = React.lazy(() => import('../Frontend/components/register.jsx'));
const DecentralizedCloudStorage = React.lazy(() => import('../Frontend/components/LandingPage.jsx'));
const Features = React.lazy(() => import('../Frontend/components/Features.jsx'));
const ForgotPassword = React.lazy(() => import('../Frontend/components/forgotpass.jsx'));

// Minimal loading spinner shown while lazy chunks load
const PageLoader = () => (
  <div className="page-loader">
    <div className="page-loader-spinner" />
  </div>
);

// Wrap each lazy component with a Suspense boundary
const withSuspense = (Component) => (
  <Suspense fallback={<PageLoader />}>
    <Component />
  </Suspense>
);

// Create a router with defined routes
const router = createBrowserRouter([
  {
    path: "/",
    element: withSuspense(DecentralizedCloudStorage), 
  },
  {
    path: "/register",
    element: withSuspense(Register), 
  },
  {
    path: "/home",
    element: withSuspense(Home), 
  },
  {
    path: "/login",
    element: withSuspense(Login), 
  },
  {
    path: "/features",
    element: withSuspense(Features), 
  },
  {
    path: "/forgotpass",
    element: withSuspense(ForgotPassword), 
  }
]);

const App = () => {
  return (
    // Wrap your app in RouterProvider to handle routing
    <RouterProvider router={router} />
  );
};

export default App;

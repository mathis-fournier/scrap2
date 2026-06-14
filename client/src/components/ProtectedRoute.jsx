import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children }) => {
    const accessToken = localStorage.getItem('accessToken');
    const userId = localStorage.getItem('userId');

    // If there is no token or userId, redirect them to the login page
    if (!accessToken || !userId) {
        return <Navigate to="/login" replace />;
    }

    // Otherwise, render the requested component
    return children;
};

export default ProtectedRoute;
import { useContext } from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import Navbar from '../components/common/Navbar';
import Footer from '../components/common/Footer';
import Loader from '../components/common/Loader';
import '../styles/owner-layout.css';

const OwnerLayout = () => {
  const { currentUser, loading, isAuthenticated, isOwner } = useContext(AuthContext);

  if (loading) {
    return <Loader />;
  }

  // Redirect if user is not authenticated or not an owner
  if (!isAuthenticated || !isOwner) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="owner-layout">
      <Navbar role="owner" />
      <main className="owner-main">
        <div className="container">
          <Outlet />
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default OwnerLayout;
import { useContext } from 'react';
import { Outlet } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import Navbar from '../components/common/Navbar';
import Footer from '../components/common/Footer';
import Loader from '../components/common/Loader';
import '../styles/buyer-layout.css';

const BuyerLayout = () => {
  const { currentUser, loading, isAuthenticated, isBuyer } = useContext(AuthContext);

  if (loading) {
    return <Loader />;
  }

  // Redirect if user is not authenticated or not a buyer
  if (!isAuthenticated || !isBuyer) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="buyer-layout">
      <Navbar role="buyer" />
      <main className="buyer-main">
        <div className="container">
          <Outlet />
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default BuyerLayout;
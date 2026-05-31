import  { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Logout = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const handleLogout = () => {
      logout();
      navigate('/login', { replace: true }); // يمنع الرجوع للصفحة السابقة
    };

    handleLogout();
  }, [logout, navigate]);

  return null;
};

export default Logout;
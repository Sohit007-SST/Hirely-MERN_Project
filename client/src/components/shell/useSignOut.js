// useSignOut: one sign-out action for the Me menu and the mobile Me sheet (log out, go home, toast).
import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';

export default function useSignOut() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  return useCallback(() => {
    logout();
    navigate('/');
    toast.success('You are signed out');
  }, [logout, navigate]);
}

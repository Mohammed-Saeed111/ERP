import { useEffect } from 'react';
import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoutes = ({ children, requiredRules }) => {
    const { user } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (!user) {
            navigate('/login');
        } else if (!requiredRules.includes(user.role)) {
            navigate('/unauthorized');
        }
    }, [user, navigate, requiredRules]);

    if (!user || !requiredRules.includes(user.role)) {
        return null;
    }

    return children;
};

ProtectedRoutes.propTypes = {
    children: PropTypes.node.isRequired,
    requiredRules: PropTypes.arrayOf(PropTypes.string).isRequired,
};

export default ProtectedRoutes;
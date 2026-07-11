import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar';

const Dashboard = () => {
  return (
    <div className="flex">
      <Sidebar />
      <div className="flex-1 min-w-0 ml-16 md:ml-64 bg-gray-100 dark:bg-slate-900 min-h-screen">
        <Outlet />
      </div>
    </div>
  );
};

export default Dashboard;
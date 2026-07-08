// import './App.css';
// import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
// import Root from './utils/Root';
// import Login from './pages/Login';
// import ProtectedRoutes from './utils/ProtectedRoutes';
// import Dashboard from './pages/Dashboard';
// import Categories from './components/Categories';
// import Products from './components/Productes';
// import Suppliers from './components/Suppliers';
// import Logout from './components/Logout';
// import Users from './components/Users';

// function App() {
//   return (
//     <Router>
//       <Routes>
//         <Route path="/" element={<Root />} />

//         <Route
//           path="/admin"
//           element={
//             <ProtectedRoutes requiredRules={["admin"]}>
//               <Dashboard />
//             </ProtectedRoutes>
//           }
//         >
//           <Route path="dashboard" element={<h1>Summary of dashboard</h1>} />
//           <Route path="categories" element={<Categories />} />
//           <Route path="products" element={<Products />} />
//           <Route path="suppliers" element={<Suppliers />} />
//           <Route path="orders" element={<h1>Orders</h1>} />
//           <Route path="users" element={<Users />} />
//           <Route path="logout" element={<Logout />} />
//         </Route>

//         <Route path="/customer/dashboard" element={<h1>customer dashboard</h1>} />
//         <Route path="/login" element={<Login />} />

//         <Route
//           path="/unauthorized"
//           element={
//             <p className="font-bold text-3xl mt-20 ml-20">
//               Unauth
//             </p>
//           }
//         />
//       </Routes>
//     </Router>
//   );
// }

// export default App;

import './App.css';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Root from './utils/Root' ;
import Login from './pages/Login';
import Register from './pages/Register';
import ProtectedRoutes from './utils/ProtectedRoutes';
import Dashboard from './pages/Dashboard';
import Categories from './components/Categories';
import Products from './components/Productes';
import Suppliers from './components/Suppliers';
import Logout from './components/Logout';
import Users from './components/Users';

// Use existing files (no new files created):
// `CutomerProducts.jsx` (note typo) and `Orders.jsx`
import CustomerProducts from './components/CutomerProducts';
import CustomerOrders from './components/Orders';
import Profile from './components/Profile';
import Summary from './components/Summary';
import Orders from './components/Orders';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Root />} />

        <Route
          path="/admin"
          element={
            <ProtectedRoutes requiredRules={["admin"]}>
              <Dashboard />
            </ProtectedRoutes>
          }
        >
          <Route path="dashboard" element={<Summary />} />
          <Route path="categories" element={<Categories />} />
          <Route path="products" element={<Products />} />
          <Route path="suppliers" element={<Suppliers />} />
          <Route path="orders" element={<Orders />} />
          <Route path="users" element={<Users />} />
                    <Route path="profile" element={<Profile />} />

          <Route path="logout" element={<Logout />} />
        </Route>

        {/* ✅ Customer Routes (uses existing Dashboard page) */}
      <Route
  path="/customer-dashboard"
  element={
    <ProtectedRoutes requiredRules={["customer"]}>
      <Dashboard />
    </ProtectedRoutes>
  }
>
          <Route index element={<CustomerProducts />} />
          <Route path="orders" element={<CustomerOrders />} />
          <Route path="profile" element={<Profile />} />
        </Route>

        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        <Route
          path="/unauthorized"
          element={
            <p className="font-bold text-3xl mt-20 ml-20">
              Unauth
            </p>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
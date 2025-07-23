import { useAuth } from "../context/AuthContext";
import { Link, useNavigate } from "react-router-dom";

const Navbar = () => {
  const { userData, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <nav className="bg-white shadow-lg border-b-2 border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Link to="/dashboard" className="flex items-center space-x-2">
              <span className="text-2xl">🧾</span>
              <span className="text-xl font-bold text-gray-800">Invoice Generator</span>
            </Link>
          </div>
          
          <div className="flex items-center space-x-6">
            <Link 
              to="/dashboard" 
              className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium transition-colors"
            >
              Dashboard
            </Link>
            <Link 
              to="/invoices" 
              className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium transition-colors"
            >
              Invoice History
            </Link>
            
            {userData && (
              <div className="flex items-center space-x-4">
                {userData.logoBase64 && (
                  <img src={userData.logoBase64} alt="Business Logo" className="h-8 w-8 rounded-full object-contain border" />
                )}
                <div className="text-sm text-gray-700">
                  <span className="font-medium">{userData.fullName}</span>
                  <span className="text-gray-500 ml-2">({userData.email})</span>
                </div>
                <button
                  onClick={handleLogout}
                  className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;

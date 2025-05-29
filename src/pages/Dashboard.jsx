// src/pages/Dashboard.jsx
import { useAuth } from "../context/AuthContext";
import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase/config";

const Dashboard = () => {
  const { currentUser } = useAuth();
  const [userData, setUserData] = useState(null);

  useEffect(() => {
    const fetchDetails = async () => {
      const docRef = doc(db, "users", currentUser.uid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setUserData(docSnap.data());
      }
    };
    if (currentUser) fetchDetails();
  }, [currentUser]);

  return (
    <div>
      <nav style={{ padding: "1rem", backgroundColor: "#eee" }}>
        <span>🧾 Invoice App</span>
      </nav>

      <div style={{ padding: "2rem" }}>
        {userData ? (
          <>
            <h1>Welcome, {userData.fullName}</h1>
            <h1>Email: {userData.email}</h1>
          </>
        ) : (
          <p>Loading...</p>
        )}
      </div>
    </div>
  );
};

export default Dashboard;

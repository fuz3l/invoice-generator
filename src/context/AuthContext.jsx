// src/contexts/AuthContext.jsx
import { createContext, useContext, useEffect, useState } from "react";
import { auth, db } from "../firebase/config";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

const AuthContext = createContext();
export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [firebaseError, setFirebaseError] = useState(null);

  useEffect(() => {
    // Check if Firebase is properly configured
    const isFirebaseConfigured = auth && db && 
      import.meta.env.VITE_FIREBASE_API_KEY && 
      import.meta.env.VITE_FIREBASE_PROJECT_ID;

    if (!isFirebaseConfigured) {
      console.warn("Firebase not configured. Please set up your environment variables.");
      setFirebaseError("Firebase configuration missing");
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      
      if (user) {
        // Fetch user data from Firestore
        try {
          const userDoc = await getDoc(doc(db, "users", user.uid));
          if (userDoc.exists()) {
            setUserData(userDoc.data());
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
          setFirebaseError("Error fetching user data");
        }
      } else {
        setUserData(null);
      }
      
      setLoading(false);
    }, (error) => {
      console.error("Firebase auth error:", error);
      setFirebaseError("Authentication error");
      setLoading(false);
    });
    
    return unsubscribe;
  }, []);

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  return (
    <AuthContext.Provider value={{ currentUser, userData, logout, firebaseError }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

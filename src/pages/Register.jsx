// src/pages/Register.jsx
import { useState } from "react";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { auth, db } from "../firebase/config";
import { useNavigate } from "react-router-dom";

const Register = () => {
  const [form, setForm] = useState({
    email: "", password: "", fullName: "", mobile: "",
    businessName: "", businessAddress: "", businessOwner: "", gstin: ""
  });

  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setError("");

    try {
      const userCred = await createUserWithEmailAndPassword(auth, form.email, form.password);
      await updateProfile(userCred.user, { displayName: form.fullName });

      await setDoc(doc(db, "users", userCred.user.uid), {
        uid: userCred.user.uid,
        email: form.email,
        fullName: form.fullName,
        mobile: form.mobile,
        businessName: form.businessName,
        businessAddress: form.businessAddress,
        businessOwner: form.businessOwner,
        gstin: form.gstin
      });

 navigate("/login");

    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div>
      <h2>Register</h2>
      <form onSubmit={handleSubmit}>
        <input name="fullName" placeholder="Full Name" onChange={handleChange} required />
        <input name="mobile" placeholder="Mobile Number" onChange={handleChange} required />
        <input name="businessName" placeholder="Business Name" onChange={handleChange} required />
        <input name="businessAddress" placeholder="Business Address" onChange={handleChange} required />
        <input name="businessOwner" placeholder="Business Owner Name" onChange={handleChange} required />
        <input name="gstin" placeholder="GSTIN" onChange={handleChange} />
        <input type="email" name="email" placeholder="Email" onChange={handleChange} required />
        <input type="password" name="password" placeholder="Password" onChange={handleChange} required />
        <button type="submit">Register</button>
        {error && <p style={{ color: "red" }}>{error}</p>}
      </form>
    </div>
  );
};

export default Register;

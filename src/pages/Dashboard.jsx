// src/pages/Dashboard.jsx
import { useAuth } from "../context/AuthContext";
import { useState } from "react";
import Navbar from "../components/Navbar";
import InvoiceForm from "../components/InvoiceForm";
import InvoicePreview from "../components/InvoicePreview";
import SalesGraph from "../components/SalesGraph";
import { generatePDF } from "../utils/generatePDF";

const TEMPLATES = [
  { value: "modern", label: "Modern (Blue/White)" },
  { value: "classic", label: "Classic (Serif, Gray)" },
  { value: "minimal", label: "Minimal (Whitespace)" },
  { value: "colorful", label: "Colorful (Accent)" },
  { value: "elegant", label: "Elegant (Gold, Sleek)" },
  { value: "corporate", label: "Corporate (Blue/Gray)" },
  { value: "playful", label: "Playful (Pink/Yellow, Fun)" },
  { value: "monochrome", label: "Monochrome (Black/White)" },
  { value: "green", label: "Green (Eco, Green Accent)" },
];

const Dashboard = () => {
  const { currentUser, userData, firebaseError } = useAuth();
  const [invoiceData, setInvoiceData] = useState({
    customerName: "",
    customerEmail: "",
    customerPhone: "",
    customerAddress: "",
    items: [
      {
        productName: "",
        quantity: 1,
        price: 0,
        description: ""
      }
    ]
  });
  const [selectedTemplate, setSelectedTemplate] = useState("modern");

  const handleInvoiceDataChange = (newData) => {
    setInvoiceData(newData);
  };

  const handleGeneratePDF = async (data, userData, invoiceNumber, currentDate, subtotal, tax, total) => {
    try {
      await generatePDF(data, userData, invoiceNumber, currentDate, subtotal, tax, total, currentUser.uid);
      alert("Invoice generated and saved successfully!");
    } catch (error) {
      console.error("Error generating invoice:", error);
      alert("Error generating invoice. Please try again.");
    }
  };

  // Show Firebase configuration error
  if (firebaseError) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800">
                  Firebase Configuration Required
                </h3>
                <div className="mt-2 text-sm text-yellow-700">
                  <p>To use this application, you need to configure Firebase:</p>
                  <ol className="list-decimal list-inside mt-2 space-y-1">
                    <li>Create a Firebase project at <a href="https://console.firebase.google.com/" target="_blank" rel="noopener noreferrer" className="underline">Firebase Console</a></li>
                    <li>Enable Authentication (Email/Password)</li>
                    <li>Create a Firestore database</li>
                    <li>Create a <code className="bg-yellow-100 px-1 rounded">.env</code> file with your Firebase configuration</li>
                  </ol>
                  <div className="mt-4 p-3 bg-yellow-100 rounded text-xs">
                    <p className="font-medium">Example .env file:</p>
                    <pre className="mt-1 text-yellow-800">
{`VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id`}
                    </pre>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!userData) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading your dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Welcome back, {userData.fullName}! 👋
          </h1>
          <p className="text-gray-600">
            Create professional invoices for your customers with ease.
          </p>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Invoice Form Section */}
          <div>
            <InvoiceForm onInvoiceDataChange={handleInvoiceDataChange} />
          </div>

          {/* Invoice Preview Section */}
          <div>
            {/* Template Selector */}
            <div className="mb-4">
              <label htmlFor="template-select" className="block text-sm font-medium text-gray-700 mb-1">Invoice Template</label>
              <select
                id="template-select"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={selectedTemplate}
                onChange={e => setSelectedTemplate(e.target.value)}
              >
                {TEMPLATES.map(t => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
            <InvoicePreview 
              invoiceData={invoiceData} 
              onGeneratePDF={handleGeneratePDF}
              template={selectedTemplate}
            />
          </div>
        </div>

        {/* Sales Graph */}
        <div className="mt-12">
          <SalesGraph currentUser={currentUser} />
        </div>

        {/* Quick Stats */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-blue-100 text-blue-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Business Name</p>
                <p className="text-lg font-semibold text-gray-800">{userData.businessName}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-green-100 text-green-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">GSTIN</p>
                <p className="text-lg font-semibold text-gray-800">{userData.gstin || "Not provided"}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-purple-100 text-purple-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Contact</p>
                <p className="text-lg font-semibold text-gray-800">{userData.mobile}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

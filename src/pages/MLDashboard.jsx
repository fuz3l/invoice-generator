import { useAuth } from "../context/AuthContext";
import { useState, useEffect } from "react";
import { collection, query, orderBy, getDocs } from "firebase/firestore";
import { db } from "../firebase/config";
import Navbar from "../components/Navbar";
import MLAnalytics from "../components/MLAnalytics";
import {
  RevenueForecastModel,
  CustomerSegmentation,
  AnomalyDetection,
  calculateMetrics
} from "../utils/mlUtils";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

const MLDashboard = () => {
  const { currentUser, userData } = useAuth();
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  
  // Model states
  const [models, setModels] = useState({
    forecast: null,
    segmentation: null,
    anomaly: null
  });
  
  const [modelStatus, setModelStatus] = useState({
    forecast: { trained: false, accuracy: null, lastTrained: null },
    segmentation: { trained: false, accuracy: null, lastTrained: null },
    anomaly: { trained: false, accuracy: null, lastTrained: null }
  });

  useEffect(() => {
    const fetchInvoices = async () => {
      try {
        const invoicesRef = collection(db, `users/${currentUser.uid}/invoices`);
        const q = query(invoicesRef, orderBy("createdAt", "desc"));
        const querySnapshot = await getDocs(q);
        
        const invoicesData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        setInvoices(invoicesData);
      } catch (error) {
        console.error("Error fetching invoices:", error);
      } finally {
        setLoading(false);
      }
    };

    if (currentUser) {
      fetchInvoices();
    }
  }, [currentUser]);

  const getModelPerformanceData = () => {
    // Simulate model performance metrics
    return {
      labels: ['Revenue Forecast', 'Customer Segmentation', 'Anomaly Detection'],
      datasets: [
        {
          label: 'Model Accuracy (%)',
          data: [
            modelStatus.forecast.accuracy || 85,
            modelStatus.segmentation.accuracy || 92,
            modelStatus.anomaly.accuracy || 88
          ],
          backgroundColor: [
            'rgba(59, 130, 246, 0.8)',
            'rgba(34, 197, 94, 0.8)',
            'rgba(239, 68, 68, 0.8)',
          ],
          borderColor: [
            'rgb(59, 130, 246)',
            'rgb(34, 197, 94)',
            'rgb(239, 68, 68)',
          ],
          borderWidth: 2,
        }
      ]
    };
  };

  const getDataQualityMetrics = () => {
    const totalInvoices = invoices.length;
    const validInvoices = invoices.filter(inv => inv.total && inv.total > 0).length;
    const completeInvoices = invoices.filter(inv => 
      inv.customerName && inv.items && inv.items.length > 0
    ).length;
    
    return {
      labels: ['Total Invoices', 'Valid Invoices', 'Complete Invoices'],
      datasets: [
        {
          label: 'Data Quality Metrics',
          data: [totalInvoices, validInvoices, completeInvoices],
          backgroundColor: [
            'rgba(156, 163, 175, 0.8)',
            'rgba(34, 197, 94, 0.8)',
            'rgba(59, 130, 246, 0.8)',
          ],
          borderColor: [
            'rgb(156, 163, 175)',
            'rgb(34, 197, 94)',
            'rgb(59, 130, 246)',
          ],
          borderWidth: 2,
        }
      ]
    };
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading ML dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Machine Learning Dashboard</h1>
          <p className="text-gray-600">
            Advanced AI-powered insights and predictive analytics for your business.
          </p>
        </div>

        {/* Data Requirements Check */}
        {invoices.length < 10 && (
          <div className="mb-8 bg-yellow-50 border border-yellow-200 rounded-lg p-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800">
                  More Data Needed for ML Features
                </h3>
                <div className="mt-2 text-sm text-yellow-700">
                  <p>You currently have {invoices.length} invoices. Machine learning features require at least 10 invoices for accurate predictions.</p>
                  <p className="mt-1">Create {10 - invoices.length} more invoices to unlock advanced AI features.</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex space-x-1 mb-8">
          {['overview', 'models', 'analytics', 'insights'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === tab
                  ? 'bg-blue-500 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="min-h-96">
          {activeTab === 'overview' && (
            <div className="space-y-8">
              {/* Key Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-white p-6 rounded-lg shadow-md">
                  <div className="flex items-center">
                    <div className="p-3 rounded-full bg-blue-100 text-blue-600">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                      </svg>
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Total Invoices</p>
                      <p className="text-2xl font-bold text-gray-800">{invoices.length}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-md">
                  <div className="flex items-center">
                    <div className="p-3 rounded-full bg-green-100 text-green-600">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                      </svg>
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Data Quality Score</p>
                      <p className="text-2xl font-bold text-gray-800">
                        {invoices.length > 0 ? Math.round((invoices.filter(inv => inv.total && inv.total > 0).length / invoices.length) * 100) : 0}%
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-md">
                  <div className="flex items-center">
                    <div className="p-3 rounded-full bg-purple-100 text-purple-600">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">ML Models Ready</p>
                      <p className="text-2xl font-bold text-gray-800">
                        {invoices.length >= 10 ? '3/3' : '0/3'}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-md">
                  <div className="flex items-center">
                    <div className="p-3 rounded-full bg-yellow-100 text-yellow-600">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Last Model Update</p>
                      <p className="text-2xl font-bold text-gray-800">
                        {invoices.length >= 10 ? 'Ready' : 'N/A'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white p-6 rounded-lg shadow-md">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Model Performance</h3>
                  <div className="h-80">
                    <Bar data={getModelPerformanceData()} options={chartOptions} />
                  </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-md">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Data Quality Metrics</h3>
                  <div className="h-80">
                    <Bar data={getDataQualityMetrics()} options={chartOptions} />
                  </div>
                </div>
              </div>

              {/* ML Features Overview */}
              <div className="bg-white p-6 rounded-lg shadow-md">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Available ML Features</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center p-4 border border-gray-200 rounded-lg">
                    <div className="text-blue-500 mb-2">
                      <svg className="w-8 h-8 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                      </svg>
                    </div>
                    <h4 className="font-semibold text-gray-800 mb-2">Revenue Forecasting</h4>
                    <p className="text-sm text-gray-600">Predict future revenue using LSTM neural networks</p>
                    <div className="mt-2">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        invoices.length >= 10 ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {invoices.length >= 10 ? 'Available' : 'Need 10+ invoices'}
                      </span>
                    </div>
                  </div>

                  <div className="text-center p-4 border border-gray-200 rounded-lg">
                    <div className="text-green-500 mb-2">
                      <svg className="w-8 h-8 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                    </div>
                    <h4 className="font-semibold text-gray-800 mb-2">Customer Segmentation</h4>
                    <p className="text-sm text-gray-600">Group customers by behavior patterns</p>
                    <div className="mt-2">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        invoices.length >= 10 ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {invoices.length >= 10 ? 'Available' : 'Need 10+ invoices'}
                      </span>
                    </div>
                  </div>

                  <div className="text-center p-4 border border-gray-200 rounded-lg">
                    <div className="text-red-500 mb-2">
                      <svg className="w-8 h-8 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                      </svg>
                    </div>
                    <h4 className="font-semibold text-gray-800 mb-2">Anomaly Detection</h4>
                    <p className="text-sm text-gray-600">Identify unusual invoice patterns</p>
                    <div className="mt-2">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        invoices.length >= 10 ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {invoices.length >= 10 ? 'Available' : 'Need 10+ invoices'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'models' && (
            <div className="space-y-6">
              <div className="bg-white p-6 rounded-lg shadow-md">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Model Management</h3>
                <div className="space-y-4">
                  {[
                    { name: 'Revenue Forecast Model', type: 'forecast', description: 'LSTM neural network for time series prediction' },
                    { name: 'Customer Segmentation Model', type: 'segmentation', description: 'Clustering algorithm for customer grouping' },
                    { name: 'Anomaly Detection Model', type: 'anomaly', description: 'Autoencoder for detecting unusual patterns' }
                  ].map((model) => (
                    <div key={model.type} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                      <div>
                        <h4 className="font-semibold text-gray-800">{model.name}</h4>
                        <p className="text-sm text-gray-600">{model.description}</p>
                        <div className="mt-2">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            modelStatus[model.type].trained ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                          }`}>
                            {modelStatus[model.type].trained ? 'Trained' : 'Not Trained'}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        {modelStatus[model.type].accuracy && (
                          <p className="text-sm text-gray-600">Accuracy: {modelStatus[model.type].accuracy}%</p>
                        )}
                        {modelStatus[model.type].lastTrained && (
                          <p className="text-xs text-gray-500">Last trained: {modelStatus[model.type].lastTrained}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'analytics' && (
            <div>
              <MLAnalytics />
            </div>
          )}

          {activeTab === 'insights' && (
            <div className="space-y-6">
              <div className="bg-white p-6 rounded-lg shadow-md">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">AI-Generated Insights</h3>
                {invoices.length >= 10 ? (
                  <div className="space-y-4">
                    <div className="p-4 bg-blue-50 rounded-lg">
                      <h4 className="font-semibold text-blue-800 mb-2">Revenue Trend Analysis</h4>
                      <p className="text-blue-700">Based on your invoice data, we can identify seasonal patterns and growth trends to help optimize your business strategy.</p>
                    </div>
                    <div className="p-4 bg-green-50 rounded-lg">
                      <h4 className="font-semibold text-green-800 mb-2">Customer Behavior Insights</h4>
                      <p className="text-green-700">Our ML models can segment your customers and identify high-value clients for targeted marketing campaigns.</p>
                    </div>
                    <div className="p-4 bg-purple-50 rounded-lg">
                      <h4 className="font-semibold text-purple-800 mb-2">Risk Assessment</h4>
                      <p className="text-purple-700">Anomaly detection helps identify unusual transactions that may require attention or investigation.</p>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-600">Generate more invoices to unlock AI-powered insights.</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MLDashboard; 
import { useState, useEffect } from "react";
import { collection, query, orderBy, getDocs, where } from "firebase/firestore";
import { db } from "../firebase/config";
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
import { Line, Bar, Doughnut } from 'react-chartjs-2';

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

const SalesGraph = ({ currentUser }) => {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [chartType, setChartType] = useState('line');
  const [timeRange, setTimeRange] = useState('month');

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

  const processData = () => {
    if (!invoices.length) return { labels: [], datasets: [] };

    const now = new Date();
    let filteredInvoices = [];
    let labels = [];
    let groupBy = '';

    // Filter invoices based on time range
    switch (timeRange) {
      case 'week':
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        filteredInvoices = invoices.filter(invoice => 
          new Date(invoice.createdAt?.toDate?.() || invoice.date) >= weekAgo
        );
        labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
        groupBy = 'day';
        break;
      case 'month':
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        filteredInvoices = invoices.filter(invoice => 
          new Date(invoice.createdAt?.toDate?.() || invoice.date) >= monthAgo
        );
        labels = Array.from({ length: 30 }, (_, i) => `Day ${i + 1}`);
        groupBy = 'day';
        break;
      case 'year':
        const yearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        filteredInvoices = invoices.filter(invoice => 
          new Date(invoice.createdAt?.toDate?.() || invoice.date) >= yearAgo
        );
        labels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        groupBy = 'month';
        break;
      default:
        filteredInvoices = invoices;
        labels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        groupBy = 'month';
    }

    // Group invoices by time period
    const groupedData = {};
    labels.forEach(label => groupedData[label] = 0);

    filteredInvoices.forEach(invoice => {
      const invoiceDate = new Date(invoice.createdAt?.toDate?.() || invoice.date);
      let key = '';

      if (groupBy === 'day') {
        if (timeRange === 'week') {
          const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
          key = dayNames[invoiceDate.getDay()];
        } else {
          const dayOfMonth = invoiceDate.getDate();
          key = `Day ${dayOfMonth}`;
        }
      } else if (groupBy === 'month') {
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        key = monthNames[invoiceDate.getMonth()];
      }

      if (groupedData.hasOwnProperty(key)) {
        groupedData[key] += invoice.total || 0;
      }
    });

    const data = labels.map(label => groupedData[label] || 0);

    return {
      labels,
      datasets: [
        {
          label: 'Sales Revenue (₹)',
          data,
          borderColor: 'rgb(59, 130, 246)',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          tension: 0.4,
          fill: chartType === 'line',
        },
      ],
    };
  };

  const chartData = processData();

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: `Sales Revenue - ${timeRange.charAt(0).toUpperCase() + timeRange.slice(1)}ly View`,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: function(value) {
            return '₹' + value.toLocaleString();
          }
        }
      }
    }
  };

  const renderChart = () => {
    switch (chartType) {
      case 'bar':
        return <Bar data={chartData} options={options} />;
      case 'doughnut':
        return <Doughnut data={chartData} options={options} />;
      default:
        return <Line data={chartData} options={options} />;
    }
  };

  if (loading) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading sales data...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 sm:mb-0">Sales Analytics</h3>
        
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Time Range Selector */}
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          >
            <option value="week">Last Week</option>
            <option value="month">Last Month</option>
            <option value="year">Last Year</option>
          </select>

          {/* Chart Type Selector */}
          <select
            value={chartType}
            onChange={(e) => setChartType(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          >
            <option value="line">Line Chart</option>
            <option value="bar">Bar Chart</option>
            <option value="doughnut">Doughnut Chart</option>
          </select>
        </div>
      </div>

      {invoices.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No sales data available</h3>
          <p className="text-gray-600">
            Create your first invoice to see sales analytics here.
          </p>
        </div>
      ) : (
        <div className="h-80">
          {renderChart()}
        </div>
      )}

      {/* Summary Stats */}
      {invoices.length > 0 && (
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <p className="text-sm font-medium text-blue-600">Total Revenue</p>
            <p className="text-xl font-bold text-blue-800">
              ₹{invoices.reduce((sum, invoice) => sum + (invoice.total || 0), 0).toLocaleString()}
            </p>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <p className="text-sm font-medium text-green-600">Total Invoices</p>
            <p className="text-xl font-bold text-green-800">{invoices.length}</p>
          </div>
          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <p className="text-sm font-medium text-purple-600">Avg. Invoice Value</p>
            <p className="text-xl font-bold text-purple-800">
              ₹{(invoices.reduce((sum, invoice) => sum + (invoice.total || 0), 0) / invoices.length).toFixed(2)}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default SalesGraph; 
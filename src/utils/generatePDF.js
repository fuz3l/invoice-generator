import html2pdf from 'html2pdf.js';
import { doc, addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase/config';

export const generatePDF = async (invoiceData, userData, invoiceNumber, currentDate, subtotal, tax, total, userId) => {
  try {
    // Get the invoice template element
    const element = document.getElementById('invoice-template');
    
    if (!element) {
      throw new Error('Invoice template not found');
    }

    // Configure PDF options
    const opt = {
      margin: [10, 10, 10, 10],
      filename: `invoice-${invoiceNumber}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { 
        scale: 2,
        useCORS: true,
        letterRendering: true
      },
      jsPDF: { 
        unit: 'mm', 
        format: 'a4', 
        orientation: 'portrait' 
      }
    };

    // Generate PDF
    const pdf = await html2pdf().set(opt).from(element).save();

    // Save invoice data to Firestore
    const invoiceDoc = {
      invoiceNumber,
      date: currentDate,
      customerName: invoiceData.customerName,
      customerEmail: invoiceData.customerEmail,
      customerPhone: invoiceData.customerPhone,
      customerAddress: invoiceData.customerAddress,
      items: invoiceData.items,
      subtotal: subtotal,
      tax: tax,
      total: total,
      businessInfo: {
        businessName: userData.businessName,
        businessAddress: userData.businessAddress,
        businessOwner: userData.businessOwner,
        gstin: userData.gstin,
        mobile: userData.mobile
      },
      createdAt: serverTimestamp(),
      userId: userId
    };

    // Add to Firestore
    await addDoc(collection(db, `users/${userId}/invoices`), invoiceDoc);

    return { success: true, invoiceNumber };
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw error;
  }
};

// Function to format currency
export const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR'
  }).format(amount);
};

// Function to format date
export const formatDate = (date) => {
  return new Date(date).toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

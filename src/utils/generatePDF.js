import html2pdf from 'html2pdf.js';
import { doc, addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase/config';

// Function to create invoice template HTML dynamically
const createInvoiceTemplate = (invoiceData, userData, invoiceNumber, currentDate, subtotal, tax, total) => {
  const gstPercent = tax > 0 ? ((tax / subtotal) * 100).toFixed(2) : 0;
  
  return `
    <div id="invoice-template" style="font-family: Arial, sans-serif; background: white; padding: 20px; max-width: 800px; margin: 0 auto;">
      <h1 style="color: #2563eb; text-align: center; margin-bottom: 30px;">INVOICE</h1>
      
      <div style="margin-bottom: 20px;">
        <strong>Business:</strong> ${userData?.businessName || "Your Business Name"}<br>
        <strong>Address:</strong> ${userData?.businessAddress || "Business Address"}<br>
        <strong>GSTIN:</strong> ${userData?.gstin || "GSTIN Number"}<br>
        <strong>Contact:</strong> ${userData?.mobile || "Mobile Number"}
      </div>
      
      <div style="margin-bottom: 20px;">
        <strong>Invoice #:</strong> ${invoiceNumber}<br>
        <strong>Date:</strong> ${currentDate}
      </div>
      
      <div style="margin-bottom: 20px;">
        <strong>Bill To:</strong><br>
        ${invoiceData.customerName || "Customer Name"}<br>
        ${invoiceData.customerEmail ? `${invoiceData.customerEmail}<br>` : ''}
        ${invoiceData.customerPhone ? `${invoiceData.customerPhone}<br>` : ''}
        ${invoiceData.customerAddress ? `${invoiceData.customerAddress}` : ''}
      </div>
      
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
        <thead>
          <tr style="background: #f1f5f9;">
            <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Item</th>
            <th style="border: 1px solid #ddd; padding: 8px; text-align: center;">Qty</th>
            <th style="border: 1px solid #ddd; padding: 8px; text-align: right;">Price</th>
            <th style="border: 1px solid #ddd; padding: 8px; text-align: right;">Total</th>
          </tr>
        </thead>
        <tbody>
          ${invoiceData.items?.map((item, index) => `
            <tr>
              <td style="border: 1px solid #ddd; padding: 8px;">${item.productName || "Product Name"}</td>
              <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${item.quantity || 0}</td>
              <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">₹${item.price?.toFixed(2) || "0.00"}</td>
              <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">₹${((item.quantity || 0) * (item.price || 0)).toFixed(2)}</td>
            </tr>
          `).join('') || '<tr><td colspan="4" style="border: 1px solid #ddd; padding: 8px; text-align: center;">No items</td></tr>'}
        </tbody>
      </table>
      
      <div style="text-align: right; margin-bottom: 20px;">
        <div><strong>Subtotal:</strong> ₹${subtotal.toFixed(2)}</div>
        <div><strong>GST${gstPercent ? ` (${gstPercent}%)` : ''}:</strong> ₹${tax.toFixed(2)}</div>
        <div style="font-size: 18px; font-weight: bold; margin-top: 10px;"><strong>Total:</strong> ₹${total.toFixed(2)}</div>
      </div>
      
      <div style="text-align: center; margin-top: 30px; color: #666;">
        <p><strong>Thank you for your business!</strong></p>
        <p>Payment is due within 30 days.</p>
      </div>
    </div>
  `;
};

export const generatePDF = async (invoiceData, userData, invoiceNumber, currentDate, subtotal, tax, total, userId) => {
  try {
    console.log("generatePDF called with:", { invoiceData, userData, invoiceNumber, currentDate, subtotal, tax, total, userId });
    
    // Try to get the existing invoice template element first
    let element = document.getElementById('invoice-template');
    
    // If element doesn't exist (e.g., on Invoice History page), create it dynamically
    if (!element) {
      console.log("Creating dynamic invoice template");
      
      // First, let's test with a simple element to see if html2pdf works at all
      const testElement = document.createElement('div');
      testElement.innerHTML = `
        <div style="background: white; padding: 20px; font-family: Arial, sans-serif;">
          <h1 style="color: blue;">Test Invoice</h1>
          <p><strong>Invoice #:</strong> ${invoiceNumber}</p>
          <p><strong>Date:</strong> ${currentDate}</p>
          <p><strong>Customer:</strong> ${invoiceData.customerName || "Customer Name"}</p>
          <p><strong>Total:</strong> ₹${total.toFixed(2)}</p>
        </div>
      `;
      
      // Add test element to DOM
      testElement.style.position = 'fixed';
      testElement.style.left = '0';
      testElement.style.top = '0';
      testElement.style.zIndex = '-1000';
      document.body.appendChild(testElement);
      
      // Wait for rendering
      await new Promise(resolve => setTimeout(resolve, 500));
      
      console.log("Test element created, trying PDF generation...");
      
      // Try with the simple test element first
      try {
        const testOpt = {
          margin: [10, 10, 10, 10],
          filename: `test-invoice-${invoiceNumber}.pdf`,
          image: { type: 'jpeg', quality: 0.98 },
          html2canvas: { 
            scale: 1,
            useCORS: true,
            allowTaint: true,
            backgroundColor: '#ffffff'
          },
          jsPDF: { 
            unit: 'mm', 
            format: 'a4', 
            orientation: 'portrait' 
          }
        };
        
        await html2pdf().set(testOpt).from(testElement).save();
        console.log("Test PDF generated successfully");
        
        // Clean up test element
        document.body.removeChild(testElement);
        
        // Now try with the full template
        const templateHTML = createInvoiceTemplate(invoiceData, userData, invoiceNumber, currentDate, subtotal, tax, total);
        const tempContainer = document.createElement('div');
        tempContainer.innerHTML = templateHTML;
        element = tempContainer.firstElementChild;
        
        // Add to DOM
        element.style.position = 'fixed';
        element.style.left = '0';
        element.style.top = '0';
        element.style.width = '800px';
        element.style.height = 'auto';
        element.style.zIndex = '-1000';
        element.style.backgroundColor = '#ffffff';
        element.style.padding = '20px';
        element.style.boxSizing = 'border-box';
        document.body.appendChild(element);
        
        await new Promise(resolve => setTimeout(resolve, 500));
        console.log("Full template element created and added to DOM");
        
      } catch (testError) {
        console.error("Test PDF generation failed:", testError);
        // Clean up test element
        if (document.body.contains(testElement)) {
          document.body.removeChild(testElement);
        }
        throw new Error("PDF generation is not working. Please check browser compatibility.");
      }
    } else {
      console.log("Using existing invoice template element");
    }

    // Configure PDF options
    const opt = {
      margin: [10, 10, 10, 10],
      filename: `invoice-${invoiceNumber}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { 
        scale: 1,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: true,
        removeContainer: false
      },
      jsPDF: { 
        unit: 'mm', 
        format: 'a4', 
        orientation: 'portrait' 
      }
    };

    console.log("Generating PDF with options:", opt);
    console.log("Element to convert:", element);
    console.log("Element HTML:", element.outerHTML);

    // Generate PDF
    try {
      const pdf = await html2pdf().set(opt).from(element).save();
      console.log("PDF generated successfully");
    } catch (pdfError) {
      console.error("PDF generation failed:", pdfError);
      
      // Fallback: try with a simpler approach
      console.log("Trying fallback PDF generation...");
      const fallbackOpt = {
        margin: [10, 10, 10, 10],
        filename: `invoice-${invoiceNumber}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { 
          scale: 1,
          useCORS: true,
          allowTaint: true,
          backgroundColor: '#ffffff'
        },
        jsPDF: { 
          unit: 'mm', 
          format: 'a4', 
          orientation: 'portrait' 
        }
      };
      
      await html2pdf().set(fallbackOpt).from(element).save();
      console.log("Fallback PDF generated successfully");
    }

    // Clean up temporary element if it was created dynamically
    if (element.style.position === 'absolute') {
      document.body.removeChild(element);
    }

    // Only save to Firestore if this is a new invoice (not downloading from history)
    // We can determine this by checking if the element was created dynamically
    const isNewInvoice = element.style.position !== 'absolute';
    
    if (userId && isNewInvoice) {
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
    }

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

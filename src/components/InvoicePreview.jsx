import { useAuth } from "../context/AuthContext";

const InvoicePreview = ({ invoiceData, onGeneratePDF, template = "modern" }) => {
  const { userData } = useAuth();

  // Calculate totals
  const calculateSubtotal = () => {
    return invoiceData.items?.reduce((sum, item) => {
      return sum + (item.quantity * item.price);
    }, 0) || 0;
  };

  const subtotal = calculateSubtotal();
  const tax = subtotal * 0.1; // 10% tax
  const total = subtotal + tax;

  // Generate invoice number
  const invoiceNumber = `INV-${Date.now()}`;
  const currentDate = new Date().toLocaleDateString('en-IN');

  // WhatsApp share handler
  const handleShareWhatsApp = () => {
    const message =
      `*Invoice from ${userData?.businessName || 'Business'}*\n` +
      `Invoice #: ${invoiceNumber}\n` +
      `Date: ${currentDate}\n` +
      `Customer: ${invoiceData.customerName || ''}\n` +
      `Total: ₹${total.toFixed(2)}\n` +
      `\nThank you for your business!`;
    const encoded = encodeURIComponent(message);
    window.open(`https://wa.me/?text=${encoded}`, '_blank');
  };

  // --- TEMPLATES ---
  // Modern (default, blue/white)
  const ModernTemplate = () => (
    <div
      id="invoice-template"
      className="p-8 rounded-lg shadow-lg max-w-4xl mx-auto"
      style={{ background: '#fff', color: '#222' }}
    >
      {/* Header */}
      <div style={{ borderBottom: '2px solid #e5e7eb', paddingBottom: 24, marginBottom: 24 }}>
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold mb-2" style={{ color: '#0f172a' }}>
              {userData?.businessName || "Your Business Name"}
            </h1>
            <p className="mb-1" style={{ color: '#334155' }}>{userData?.businessAddress || "Business Address"}</p>
            <p className="mb-1" style={{ color: '#334155' }}>GSTIN: {userData?.gstin || "GSTIN Number"}</p>
            <p style={{ color: '#334155' }}>Owner: {userData?.businessOwner || "Business Owner"}</p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <h2 className="text-2xl font-bold mb-2" style={{ color: '#2563eb' }}>INVOICE</h2>
            <p className="mb-1" style={{ color: '#334155' }}>Invoice #: {invoiceNumber}</p>
            <p className="mb-1" style={{ color: '#334155' }}>Date: {currentDate}</p>
          </div>
        </div>
      </div>
      {/* Customer Info, Items, Totals, Footer (reuse below) */}
      {renderCommonSections()}
    </div>
  );

  // Classic (serif, gray, bordered)
  const ClassicTemplate = () => (
    <div
      id="invoice-template"
      className="p-8 rounded max-w-4xl mx-auto"
      style={{ background: '#f8fafc', color: '#222', fontFamily: 'Georgia, serif', border: '2px solid #cbd5e1' }}
    >
      <div style={{ borderBottom: '2px solid #cbd5e1', paddingBottom: 24, marginBottom: 24 }}>
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold mb-2" style={{ color: '#1e293b', fontFamily: 'Georgia, serif' }}>
              {userData?.businessName || "Your Business Name"}
            </h1>
            <p className="mb-1" style={{ color: '#64748b' }}>{userData?.businessAddress || "Business Address"}</p>
            <p className="mb-1" style={{ color: '#64748b' }}>GSTIN: {userData?.gstin || "GSTIN Number"}</p>
            <p style={{ color: '#64748b' }}>Owner: {userData?.businessOwner || "Business Owner"}</p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <h2 className="text-2xl font-bold mb-2" style={{ color: '#334155', fontFamily: 'Georgia, serif' }}>INVOICE</h2>
            <p className="mb-1" style={{ color: '#64748b' }}>Invoice #: {invoiceNumber}</p>
            <p className="mb-1" style={{ color: '#64748b' }}>Date: {currentDate}</p>
          </div>
        </div>
      </div>
      {renderCommonSections({
        tableStyle: { border: '1px solid #cbd5e1' },
        thStyle: { background: '#e2e8f0', color: '#334155', border: '1px solid #cbd5e1' },
        tdStyle: { border: '1px solid #cbd5e1' },
        accent: '#334155',
        totalColor: '#1e293b',
        fontFamily: 'Georgia, serif',
      })}
    </div>
  );

  // Minimal (no borders, whitespace)
  const MinimalTemplate = () => (
    <div
      id="invoice-template"
      className="p-8 max-w-3xl mx-auto"
      style={{ background: '#fff', color: '#222', fontFamily: 'Arial, sans-serif' }}
    >
      <div style={{ marginBottom: 24 }}>
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold mb-2" style={{ color: '#222' }}>
              {userData?.businessName || "Your Business Name"}
            </h1>
            <p className="mb-1" style={{ color: '#666' }}>{userData?.businessAddress || "Business Address"}</p>
            <p className="mb-1" style={{ color: '#666' }}>GSTIN: {userData?.gstin || "GSTIN Number"}</p>
            <p style={{ color: '#666' }}>Owner: {userData?.businessOwner || "Business Owner"}</p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <h2 className="text-xl font-bold mb-2" style={{ color: '#2563eb' }}>INVOICE</h2>
            <p className="mb-1" style={{ color: '#666' }}>Invoice #: {invoiceNumber}</p>
            <p className="mb-1" style={{ color: '#666' }}>Date: {currentDate}</p>
          </div>
        </div>
      </div>
      {renderCommonSections({
        tableStyle: { border: 'none' },
        thStyle: { background: '#f1f5f9', color: '#222', border: 'none' },
        tdStyle: { border: 'none' },
        accent: '#2563eb',
        totalColor: '#222',
        fontFamily: 'Arial, sans-serif',
      })}
    </div>
  );

  // Colorful (accent color, bold headings)
  const ColorfulTemplate = () => (
    <div
      id="invoice-template"
      className="p-8 rounded-lg shadow-lg max-w-4xl mx-auto"
      style={{ background: '#fff7ed', color: '#78350f', border: '2px solid #fdba74', fontFamily: 'Poppins, Arial, sans-serif' }}
    >
      <div style={{ borderBottom: '2px solid #fdba74', paddingBottom: 24, marginBottom: 24 }}>
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold mb-2" style={{ color: '#ea580c', fontFamily: 'Poppins, Arial, sans-serif' }}>
              {userData?.businessName || "Your Business Name"}
            </h1>
            <p className="mb-1" style={{ color: '#78350f' }}>{userData?.businessAddress || "Business Address"}</p>
            <p className="mb-1" style={{ color: '#78350f' }}>GSTIN: {userData?.gstin || "GSTIN Number"}</p>
            <p style={{ color: '#78350f' }}>Owner: {userData?.businessOwner || "Business Owner"}</p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <h2 className="text-2xl font-bold mb-2" style={{ color: '#ea580c' }}>INVOICE</h2>
            <p className="mb-1" style={{ color: '#78350f' }}>Invoice #: {invoiceNumber}</p>
            <p className="mb-1" style={{ color: '#78350f' }}>Date: {currentDate}</p>
          </div>
        </div>
      </div>
      {renderCommonSections({
        tableStyle: { border: '1px solid #fdba74' },
        thStyle: { background: '#fdba74', color: '#78350f', border: '1px solid #fdba74' },
        tdStyle: { border: '1px solid #fdba74' },
        accent: '#ea580c',
        totalColor: '#ea580c',
        fontFamily: 'Poppins, Arial, sans-serif',
      })}
    </div>
  );

  // --- Common Sections for All Templates ---
  function renderCommonSections(opts = {}) {
    const {
      tableStyle = { border: 'none' },
      thStyle = { background: '#f1f5f9', color: '#334155', border: 'none' },
      tdStyle = { border: 'none' },
      accent = '#2563eb',
      totalColor = '#0f172a',
      fontFamily = 'inherit',
    } = opts;
    return (
      <>
        {/* Customer Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          <div>
            <h3 className="text-lg font-semibold mb-3" style={{ color: accent, fontFamily }}>Bill To:</h3>
            <p className="font-medium mb-1" style={{ color: '#222', fontFamily }}>
              {invoiceData.customerName || "Customer Name"}
            </p>
            {invoiceData.customerEmail && (
              <p className="mb-1" style={{ color: '#666', fontFamily }}>{invoiceData.customerEmail}</p>
            )}
            {invoiceData.customerPhone && (
              <p className="mb-1" style={{ color: '#666', fontFamily }}>{invoiceData.customerPhone}</p>
            )}
            {invoiceData.customerAddress && (
              <p style={{ color: '#666', fontFamily }}>{invoiceData.customerAddress}</p>
            )}
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-3" style={{ color: accent, fontFamily }}>From:</h3>
            <p className="font-medium mb-1" style={{ color: '#222', fontFamily }}>
              {userData?.businessName || "Your Business Name"}
            </p>
            <p className="mb-1" style={{ color: '#666', fontFamily }}>{userData?.businessAddress || "Business Address"}</p>
            <p className="mb-1" style={{ color: '#666', fontFamily }}>GSTIN: {userData?.gstin || "GSTIN Number"}</p>
            <p style={{ color: '#666', fontFamily }}>Contact: {userData?.mobile || "Mobile Number"}</p>
          </div>
        </div>
        {/* Items Table */}
        <div className="mb-8">
          <table className="w-full border-collapse" style={tableStyle}>
            <thead>
              <tr>
                <th style={{ ...thStyle, padding: '12px 16px', textAlign: 'left', fontFamily }}>Item Description</th>
                <th style={{ ...thStyle, padding: '12px 16px', textAlign: 'center', fontFamily }}>Quantity</th>
                <th style={{ ...thStyle, padding: '12px 16px', textAlign: 'right', fontFamily }}>Unit Price (₹)</th>
                <th style={{ ...thStyle, padding: '12px 16px', textAlign: 'right', fontFamily }}>Amount (₹)</th>
              </tr>
            </thead>
            <tbody>
              {invoiceData.items?.map((item, index) => (
                <tr key={index} style={{ background: index % 2 === 0 ? '#fff' : '#f8fafc', fontFamily }}>
                  <td style={{ ...tdStyle, padding: '12px 16px' }}>
                    <div>
                      <p className="font-medium" style={{ color: '#222', fontFamily }}>{item.productName || "Product Name"}</p>
                      {item.description && (
                        <p className="text-sm" style={{ color: '#64748b', fontFamily }}>{item.description}</p>
                      )}
                    </div>
                  </td>
                  <td style={{ ...tdStyle, padding: '12px 16px', textAlign: 'center', color: '#222', fontFamily }}>
                    {item.quantity || 0}
                  </td>
                  <td style={{ ...tdStyle, padding: '12px 16px', textAlign: 'right', color: '#222', fontFamily }}>
                    ₹{item.price?.toFixed(2) || "0.00"}
                  </td>
                  <td style={{ ...tdStyle, padding: '12px 16px', textAlign: 'right', color: '#222', fontWeight: 500, fontFamily }}>
                    ₹{((item.quantity || 0) * (item.price || 0)).toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {/* Totals */}
        <div className="flex justify-end">
          <div style={{ width: 320 }}>
            <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: 16 }}>
              <div className="flex justify-between mb-2">
                <span style={{ color: '#666', fontFamily }}>Subtotal:</span>
                <span style={{ fontWeight: 500, fontFamily }}>₹{subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between mb-2">
                <span style={{ color: '#666', fontFamily }}>GST (10%):</span>
                <span style={{ fontWeight: 500, fontFamily }}>₹{tax.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-lg font-bold" style={{ color: totalColor, borderTop: '1px solid #e5e7eb', paddingTop: 8, fontFamily }}>
                <span>Total:</span>
                <span>₹{total.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
        {/* Footer */}
        <div style={{ marginTop: 48, paddingTop: 24, borderTop: '1px solid #e5e7eb', fontFamily }}>
          <div style={{ textAlign: 'center', color: '#64748b', fontFamily }}>
            <p className="mb-2">Thank you for your business!</p>
            <p className="text-sm">
              Payment is due within 30 days. Please include invoice number with your payment.
            </p>
          </div>
        </div>
      </>
    );
  }

  // --- Render ---
  return (
    <div className="p-6 rounded-lg shadow-md" style={{ background: template === 'colorful' ? '#fff7ed' : '#e0f2fe' }}>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold" style={{ color: '#0f172a' }}>Invoice Preview</h2>
        <div className="flex gap-3">
          <button
            onClick={() => onGeneratePDF(invoiceData, userData, invoiceNumber, currentDate, subtotal, tax, total)}
            className="px-6 py-2 rounded-md font-medium transition-colors"
            style={{ background: '#2563eb', color: '#fff' }}
          >
            Download PDF
          </button>
          <button
            onClick={handleShareWhatsApp}
            className="px-4 py-2 rounded-md font-medium flex items-center gap-2 transition-colors"
            style={{ background: '#25D366', color: '#fff' }}
            title="Share to WhatsApp"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.029-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.149-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.151-.174.2-.298.3-.497.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.5-.669-.51-.173-.007-.372-.009-.571-.009-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.099 3.2 5.077 4.363.709.306 1.262.489 1.694.626.712.227 1.36.195 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.617h-.001a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.999-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.455 4.437-9.89 9.893-9.89 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.896 6.991c-.003 5.456-4.438 9.892-9.893 9.892m8.413-18.306A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.876 11.876 0 005.683 1.447h.005c6.554 0 11.89-5.336 11.893-11.893a11.821 11.821 0 00-3.48-8.485"/>
            </svg>
            Share to WhatsApp
          </button>
        </div>
      </div>
      {/* Render selected template */}
      {template === 'classic' && <ClassicTemplate />}
      {template === 'minimal' && <MinimalTemplate />}
      {template === 'colorful' && <ColorfulTemplate />}
      {(!template || template === 'modern') && <ModernTemplate />}
    </div>
  );
};

export default InvoicePreview;

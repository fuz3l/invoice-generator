import { useState } from "react";

const InvoiceForm = ({ onInvoiceDataChange }) => {
  const [formData, setFormData] = useState({
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
    ],
    gst: "" // Add GST field
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Pass updated data to parent component
    onInvoiceDataChange({
      ...formData,
      [name]: value
    });
  };

  const handleItemChange = (index, field, value) => {
    const updatedItems = [...formData.items];
    updatedItems[index] = {
      ...updatedItems[index],
      [field]: field === 'quantity' || field === 'price' ? parseFloat(value) || 0 : value
    };
    
    const updatedFormData = {
      ...formData,
      items: updatedItems
    };
    
    setFormData(updatedFormData);
    onInvoiceDataChange(updatedFormData);
  };

  const addItem = () => {
    const newItem = {
      productName: "",
      quantity: 1,
      price: 0,
      description: ""
    };
    
    const updatedFormData = {
      ...formData,
      items: [...formData.items, newItem]
    };
    
    setFormData(updatedFormData);
    onInvoiceDataChange(updatedFormData);
  };

  const removeItem = (index) => {
    if (formData.items.length > 1) {
      const updatedItems = formData.items.filter((_, i) => i !== index);
      const updatedFormData = {
        ...formData,
        items: updatedItems
      };
      
      setFormData(updatedFormData);
      onInvoiceDataChange(updatedFormData);
    }
  };

  return (
    <div className="bg-amber-50 p-4 sm:p-6 rounded-lg shadow-md">
      <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-4 sm:mb-6">Invoice Details</h2>
      
      {/* Customer Information */}
      <div className="mb-4 sm:mb-6">
        <h3 className="text-base sm:text-lg font-semibold text-gray-700 mb-3 sm:mb-4">Customer Information</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Customer Name *
            </label>
            <input
              type="text"
              name="customerName"
              value={formData.customerName}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm sm:text-base"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Customer Email
            </label>
            <input
              type="email"
              name="customerEmail"
              value={formData.customerEmail}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm sm:text-base"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Customer Phone
            </label>
            <input
              type="tel"
              name="customerPhone"
              value={formData.customerPhone}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm sm:text-base"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Customer Address
            </label>
            <textarea
              name="customerAddress"
              value={formData.customerAddress}
              onChange={handleInputChange}
              rows="2"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm sm:text-base"
            />
          </div>
        </div>
      </div>

      {/* GST Manual Entry */}
      <div className="mb-4 sm:mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          GST (%) <span className="text-gray-400 text-xs">(optional, manual entry)</span>
        </label>
        <input
          type="number"
          name="gst"
          min="0"
          step="0.01"
          value={formData.gst}
          onChange={handleInputChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm sm:text-base"
          placeholder="Enter GST percentage (e.g. 18)"
        />
      </div>

      {/* Items */}
      <div>
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 gap-2">
          <h3 className="text-base sm:text-lg font-semibold text-gray-700">Items</h3>
          <button
            type="button"
            onClick={addItem}
            className="bg-amber-500 hover:bg-amber-600 text-white px-3 py-2 sm:px-4 rounded-md text-sm font-medium transition-colors w-full sm:w-auto"
          >
            + Add Item
          </button>
        </div>
        
        {formData.items.map((item, index) => (
          <div key={index} className="border border-gray-200 rounded-lg p-3 sm:p-4 mb-4 bg-white">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-3 gap-2">
              <h4 className="font-medium text-gray-700">Item {index + 1}</h4>
              {formData.items.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeItem(index)}
                  className="text-red-500 hover:text-red-700 text-sm font-medium self-start sm:self-auto"
                >
                  Remove
                </button>
              )}
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              <div className="sm:col-span-2 lg:col-span-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Product Name *
                </label>
                <input
                  type="text"
                  value={item.productName}
                  onChange={(e) => handleItemChange(index, 'productName', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm sm:text-base"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Quantity *
                </label>
                <input
                  type="number"
                  min="1"
                  value={item.quantity}
                  onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm sm:text-base"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Price (₹) *
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={item.price}
                  onChange={(e) => handleItemChange(index, 'price', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm sm:text-base"
                  required
                />
              </div>
              <div className="sm:col-span-2 lg:col-span-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <input
                  type="text"
                  value={item.description}
                  onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm sm:text-base"
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default InvoiceForm;

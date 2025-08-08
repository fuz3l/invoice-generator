// Web Worker for ML Training
importScripts('https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@4.5.0/dist/tf.min.js');

self.onmessage = function(e) {
  const { type, data } = e.data;
  
  switch (type) {
    case 'TRAIN_FORECAST':
      trainForecastModel(data.invoices, data.epochs);
      break;
    case 'TRAIN_SEGMENTATION':
      trainSegmentationModel(data.invoices, data.k);
      break;
    case 'TRAIN_ANOMALY':
      trainAnomalyModel(data.invoices);
      break;
    default:
      self.postMessage({ type: 'ERROR', error: 'Unknown command' });
  }
};

async function trainForecastModel(invoices, epochs = 20) {
  try {
    // Preprocess data
    const features = preprocessInvoiceData(invoices);
    const { sequences, targets } = createSequences(features, 7);
    
    // Convert to tensors
    const xs = tf.tensor3d(sequences);
    const ys = tf.tensor2d(targets, [targets.length, 1]);
    
    // Normalize targets
    const targetMean = ys.mean();
    const targetStd = ys.sub(targetMean).square().mean().sqrt();
    const normalizedYs = ys.sub(targetMean).div(targetStd);
    
    // Build model
    const model = tf.sequential({
      layers: [
        tf.layers.lstm({
          units: 30, // Reduced units for faster training
          returnSequences: true,
          inputShape: [7, 7]
        }),
        tf.layers.dropout(0.2),
        tf.layers.lstm({
          units: 20,
          returnSequences: false
        }),
        tf.layers.dropout(0.2),
        tf.layers.dense({
          units: 1,
          activation: 'linear'
        })
      ]
    });
    
    model.compile({
      optimizer: tf.train.adam(0.001),
      loss: 'meanSquaredError',
      metrics: ['mae']
    });
    
    // Train model
    const history = await model.fit(xs, normalizedYs, {
      epochs,
      batchSize: 16,
      validationSplit: 0.2,
      verbose: 0
    });
    
    // Clean up
    xs.dispose();
    ys.dispose();
    normalizedYs.dispose();
    
    self.postMessage({
      type: 'FORECAST_COMPLETE',
      result: {
        model: model,
        targetMean: targetMean.dataSync()[0],
        targetStd: targetStd.dataSync()[0],
        history: history
      }
    });
    
  } catch (error) {
    self.postMessage({ type: 'ERROR', error: error.message });
  }
}

async function trainSegmentationModel(invoices, k = 3) {
  try {
    const customers = preprocessCustomerData(invoices);
    const features = customers.map(customer => [
      customer.totalSpent / 10000,
      customer.invoiceCount / 10,
      customer.avgInvoiceValue / 1000,
      customer.daysSinceLastPurchase / 365
    ]);
    
    const xs = tf.tensor2d(features);
    const targets = tf.oneHot(tf.tensor1d(Array.from({length: customers.length}, (_, i) => i % k), 'int32'), k);
    
    const model = tf.sequential({
      layers: [
        tf.layers.dense({
          units: 8,
          activation: 'relu',
          inputShape: [4]
        }),
        tf.layers.dense({
          units: k,
          activation: 'softmax'
        })
      ]
    });
    
    model.compile({
      optimizer: tf.train.adam(0.01),
      loss: 'categoricalCrossentropy',
      metrics: ['accuracy']
    });
    
    const history = await model.fit(xs, targets, {
      epochs: 20,
      batchSize: 16,
      validationSplit: 0.2,
      verbose: 0
    });
    
    xs.dispose();
    targets.dispose();
    
    self.postMessage({
      type: 'SEGMENTATION_COMPLETE',
      result: { model, customers, features, history }
    });
    
  } catch (error) {
    self.postMessage({ type: 'ERROR', error: error.message });
  }
}

async function trainAnomalyModel(invoices) {
  try {
    const data = preprocessAnomalyData(invoices);
    const features = data.map(d => [d.total, d.itemCount, d.avgItemPrice, d.maxItemPrice]);
    
    const xs = tf.tensor2d(features);
    const ys = tf.tensor2d(features);
    
    const model = tf.sequential({
      layers: [
        tf.layers.dense({
          units: 6,
          activation: 'relu',
          inputShape: [4]
        }),
        tf.layers.dense({
          units: 3,
          activation: 'relu'
        }),
        tf.layers.dense({
          units: 6,
          activation: 'relu'
        }),
        tf.layers.dense({
          units: 4,
          activation: 'linear'
        })
      ]
    });
    
    model.compile({
      optimizer: tf.train.adam(0.001),
      loss: 'meanSquaredError'
    });
    
    const history = await model.fit(xs, ys, {
      epochs: 30,
      batchSize: 16,
      validationSplit: 0.2,
      verbose: 0
    });
    
    xs.dispose();
    ys.dispose();
    
    self.postMessage({
      type: 'ANOMALY_COMPLETE',
      result: { model, data, history }
    });
    
  } catch (error) {
    self.postMessage({ type: 'ERROR', error: error.message });
  }
}

// Helper functions
function preprocessInvoiceData(invoices) {
  if (!invoices || invoices.length === 0) return null;

  const sortedInvoices = invoices
    .filter(invoice => invoice.createdAt || invoice.date)
    .sort((a, b) => {
      const dateA = new Date(a.createdAt?.toDate?.() || a.date);
      const dateB = new Date(b.createdAt?.toDate?.() || b.date);
      return dateA - dateB;
    });

  return sortedInvoices.map((invoice, index) => {
    const date = new Date(invoice.createdAt?.toDate?.() || invoice.date);
    const dayOfWeek = date.getDay();
    const dayOfMonth = date.getDate();
    const month = date.getMonth();
    const quarter = Math.floor(month / 3);
    const total = invoice.total || 0;
    const itemCount = invoice.items?.length || 0;
    const avgItemPrice = itemCount > 0 ? total / itemCount : 0;
    
    return {
      dayOfWeek,
      dayOfMonth,
      month,
      quarter,
      total,
      itemCount,
      avgItemPrice,
      sequenceIndex: index,
      timestamp: date.getTime()
    };
  });
}

function createSequences(data, sequenceLength = 7) {
  const sequences = [];
  const targets = [];

  for (let i = sequenceLength; i < data.length; i++) {
    const sequence = data.slice(i - sequenceLength, i);
    const target = data[i].total;
    
    sequences.push(sequence.map(d => [
      d.dayOfWeek / 6,
      d.dayOfMonth / 31,
      d.month / 11,
      d.quarter / 3,
      d.itemCount / 10,
      d.avgItemPrice / 1000,
      d.total / 10000
    ]));
    targets.push(target);
  }

  return { sequences, targets };
}

function preprocessCustomerData(invoices) {
  const customerMap = {};
  
  invoices.forEach(invoice => {
    const customerName = invoice.customerName || 'Unknown';
    if (!customerMap[customerName]) {
      customerMap[customerName] = {
        name: customerName,
        totalSpent: 0,
        invoiceCount: 0,
        avgInvoiceValue: 0,
        lastPurchase: null,
        items: new Set()
      };
    }
    
    customerMap[customerName].totalSpent += invoice.total || 0;
    customerMap[customerName].invoiceCount += 1;
    customerMap[customerName].lastPurchase = new Date(invoice.createdAt?.toDate?.() || invoice.date);
    
    invoice.items?.forEach(item => {
      customerMap[customerName].items.add(item.productName || 'Unknown');
    });
  });

  Object.values(customerMap).forEach(customer => {
    customer.avgInvoiceValue = customer.totalSpent / customer.invoiceCount;
    customer.uniqueItems = customer.items.size;
    customer.daysSinceLastPurchase = Math.floor((new Date() - customer.lastPurchase) / (1000 * 60 * 60 * 24));
  });

  return Object.values(customerMap);
}

function preprocessAnomalyData(invoices) {
  return invoices.map(invoice => {
    const total = invoice.total || 0;
    const itemCount = invoice.items?.length || 0;
    const avgItemPrice = itemCount > 0 ? total / itemCount : 0;
    const maxItemPrice = Math.max(...(invoice.items?.map(item => item.price || 0) || [0]));
    
    return {
      total: total / 10000,
      itemCount: itemCount / 10,
      avgItemPrice: avgItemPrice / 1000,
      maxItemPrice: maxItemPrice / 1000,
      originalInvoice: invoice
    };
  });
} 
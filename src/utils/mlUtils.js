import * as tf from '@tensorflow/tfjs';

// Set random seed for reproducibility
// Note: Backend setting is handled automatically by TensorFlow.js

// Data preprocessing utilities
export const preprocessInvoiceData = (invoices) => {
  if (!invoices || invoices.length === 0) return null;

  // Sort invoices by date
  const sortedInvoices = invoices
    .filter(invoice => invoice.createdAt || invoice.date)
    .sort((a, b) => {
      const dateA = new Date(a.createdAt?.toDate?.() || a.date);
      const dateB = new Date(b.createdAt?.toDate?.() || b.date);
      return dateA - dateB;
    });

  // Extract features
  const features = sortedInvoices.map((invoice, index) => {
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

  return features;
};

// Create sequences for time series prediction
export const createSequences = (data, sequenceLength = 7) => {
  const sequences = [];
  const targets = [];

  for (let i = sequenceLength; i < data.length; i++) {
    const sequence = data.slice(i - sequenceLength, i);
    const target = data[i].total;
    
    sequences.push(sequence.map(d => [
      d.dayOfWeek / 6, // Normalize day of week
      d.dayOfMonth / 31, // Normalize day of month
      d.month / 11, // Normalize month
      d.quarter / 3, // Normalize quarter
      d.itemCount / 10, // Normalize item count (assuming max 10 items)
      d.avgItemPrice / 1000, // Normalize average item price
      d.total / 10000 // Normalize total (assuming max 10k)
    ]));
    targets.push(target);
  }

  return { sequences, targets };
};

// Revenue Forecasting Model with improved consistency
export class RevenueForecastModel {
  constructor(seed = 42) {
    this.model = null;
    this.isTrained = false;
    this.sequenceLength = 7;
    this.forecastDays = 30;
    this.seed = seed;
    this.targetMean = null;
    this.targetStd = null;
  }

  async buildModel() {
    // Set seed for reproducible initialization
    tf.setRandomSeed(this.seed);
    
    this.model = tf.sequential({
      layers: [
        tf.layers.lstm({
          units: 64, // Increased units for better capacity
          returnSequences: true,
          inputShape: [this.sequenceLength, 7],
          kernelInitializer: 'glorotNormal', // Better initialization
          recurrentInitializer: 'orthogonal' // Better for RNNs
        }),
        tf.layers.dropout(0.3), // Slightly increased dropout
        tf.layers.lstm({
          units: 32,
          returnSequences: false,
          kernelInitializer: 'glorotNormal',
          recurrentInitializer: 'orthogonal'
        }),
        tf.layers.dropout(0.3),
        tf.layers.dense({
          units: 16, // Added intermediate layer
          activation: 'relu',
          kernelInitializer: 'glorotNormal'
        }),
        tf.layers.dense({
          units: 1,
          activation: 'linear',
          kernelInitializer: 'glorotNormal'
        })
      ]
    });

    this.model.compile({
      optimizer: tf.train.adam(0.001, 0.9, 0.999, 1e-7), // More stable Adam config
      loss: 'meanSquaredError',
      metrics: ['mae']
    });

    return this.model;
  }

  async train(invoices, epochs = 50) {
    if (!invoices || invoices.length < this.sequenceLength + 1) {
      throw new Error('Insufficient data for training. Need at least ' + (this.sequenceLength + 1) + ' invoices.');
    }

    const features = preprocessInvoiceData(invoices);
    if (!features) throw new Error('No valid invoice data found');

    const { sequences, targets } = createSequences(features, this.sequenceLength);
    
    if (sequences.length === 0) {
      throw new Error('Not enough data to create sequences');
    }

    // Convert to tensors
    const xs = tf.tensor3d(sequences);
    const ys = tf.tensor2d(targets, [targets.length, 1]);

    // Normalize targets with more robust normalization
    const targetMean = ys.mean();
    const targetStd = ys.sub(targetMean).square().mean().sqrt();
    const normalizedYs = ys.sub(targetMean).div(targetStd);

    // Store normalization parameters
    this.targetMean = targetMean;
    this.targetStd = targetStd;

    // Build and train model
    await this.buildModel();
    
    // Early stopping callback to prevent overfitting
    let bestValLoss = Infinity;
    let patienceCount = 0;
    
    const earlyStoppingCallback = {
      onEpochEnd: (epoch, logs) => {
        // Stop if validation loss doesn't improve for 10 epochs
        if (epoch > 10 && logs.val_loss > bestValLoss) {
          patienceCount++;
          if (patienceCount >= 10) {
            this.model.stopTraining = true;
          }
        } else {
          bestValLoss = logs.val_loss;
          patienceCount = 0;
        }
      }
    };
    
    const history = await this.model.fit(xs, normalizedYs, {
      epochs,
      batchSize: Math.min(16, Math.floor(sequences.length / 4)), // Adaptive batch size
      validationSplit: 0.2,
      shuffle: true, // Shuffle data for better training
      verbose: 0,
      callbacks: [
        earlyStoppingCallback,
        {
          onEpochEnd: (epoch, logs) => {
            // Only log every 10th epoch to reduce console spam
            if (epoch % 10 === 0) {
              console.log(`Epoch ${epoch + 1}: loss = ${logs.loss.toFixed(4)}, val_loss = ${logs.val_loss.toFixed(4)}`);
            }
          }
        }
      ]
    });

    this.isTrained = true;

    // Clean up tensors
    xs.dispose();
    ys.dispose();
    normalizedYs.dispose();

    return history;
  }

  async forecast(invoices, days = 30) {
    if (!this.isTrained) {
      throw new Error('Model must be trained before forecasting');
    }

    const features = preprocessInvoiceData(invoices);
    if (!features) throw new Error('No valid invoice data found');

    // Get the last sequence for prediction
    const lastSequence = features.slice(-this.sequenceLength);
    if (lastSequence.length < this.sequenceLength) {
      throw new Error('Insufficient recent data for forecasting');
    }

    const forecasts = [];
    let currentSequence = lastSequence.map(d => [
      d.dayOfWeek / 6,
      d.dayOfMonth / 31,
      d.month / 11,
      d.quarter / 3,
      d.itemCount / 10,
      d.avgItemPrice / 1000,
      d.total / 10000
    ]);

    // Use Monte Carlo simulation for more robust forecasting
    const numSimulations = 3; // Reduced for better performance
    const allForecasts = [];

    try {
      for (let sim = 0; sim < numSimulations; sim++) {
        const simulationForecasts = [];
        let simSequence = [...currentSequence];

        for (let i = 0; i < days; i++) {
          // Predict next value
          const input = tf.tensor3d([simSequence]);
          const prediction = this.model.predict(input);
          
          // Add small noise for simulation diversity
          const noise = tf.randomNormal([1, 1], 0, 0.01);
          const noisyPrediction = prediction.add(noise);
          
          // Denormalize prediction
          const denormalizedPrediction = noisyPrediction.mul(this.targetStd).add(this.targetMean);
          const forecastValue = await denormalizedPrediction.data();
          
          simulationForecasts.push(Math.max(0, forecastValue[0])); // Ensure non-negative

          // Update sequence for next prediction
          const lastDate = new Date(features[features.length - 1].timestamp);
          const nextDate = new Date(lastDate.getTime() + (i + 1) * 24 * 60 * 60 * 1000);
          
          const newPoint = [
            nextDate.getDay() / 6,
            nextDate.getDate() / 31,
            nextDate.getMonth() / 11,
            Math.floor(nextDate.getMonth() / 3) / 3,
            simSequence[simSequence.length - 1][4], // Keep same item count
            simSequence[simSequence.length - 1][5], // Keep same avg price
            forecastValue[0] / 10000 // Use predicted value
          ];

          simSequence.push(newPoint);
          simSequence.shift();

          // Clean up tensors
          input.dispose();
          prediction.dispose();
          noisyPrediction.dispose();
          denormalizedPrediction.dispose();
          noise.dispose();
        }
        
        allForecasts.push(simulationForecasts);
      }
    } catch (error) {
      console.error('Error in Monte Carlo simulation:', error);
      // Fallback to simple forecasting
      for (let i = 0; i < days; i++) {
        const input = tf.tensor3d([currentSequence]);
        const prediction = this.model.predict(input);
        const denormalizedPrediction = prediction.mul(this.targetStd).add(this.targetMean);
        const forecastValue = await denormalizedPrediction.data();
        forecasts.push(Math.max(0, forecastValue[0]));
        
        // Clean up tensors
        input.dispose();
        prediction.dispose();
        denormalizedPrediction.dispose();
      }
      return forecasts;
    }

    // Average the simulations for final forecast
    for (let day = 0; day < days; day++) {
      const dayForecasts = allForecasts.map(sim => sim[day]);
      const avgForecast = dayForecasts.reduce((sum, val) => sum + val, 0) / numSimulations;
      forecasts.push(avgForecast);
    }

    return forecasts;
  }

  // Evaluate model performance on historical data
  async evaluateModel(invoices) {
    if (!this.isTrained) {
      throw new Error('Model must be trained before evaluation');
    }

    const features = preprocessInvoiceData(invoices);
    if (!features) throw new Error('No valid invoice data found');

    const { sequences, targets } = createSequences(features, this.sequenceLength);
    
    if (sequences.length === 0) {
      throw new Error('Not enough data to create sequences');
    }

    // Convert to tensors
    const xs = tf.tensor3d(sequences);
    const ys = tf.tensor2d(targets, [targets.length, 1]);

    // Normalize targets
    const normalizedYs = ys.sub(this.targetMean).div(this.targetStd);

    // Evaluate model
    const evaluation = this.model.evaluate(xs, normalizedYs);
    const loss = await evaluation[0].data();
    const mae = await evaluation[1].data();

    // Calculate additional metrics
    const predictions = this.model.predict(xs);
    const denormalizedPredictions = predictions.mul(this.targetStd).add(this.targetMean);
    const predValues = await denormalizedPredictions.data();
    const actualValues = await ys.data();

    const metrics = calculateMetrics(Array.from(predValues), Array.from(actualValues));

    // Clean up tensors
    xs.dispose();
    ys.dispose();
    normalizedYs.dispose();
    predictions.dispose();
    denormalizedPredictions.dispose();
    evaluation[0].dispose();
    evaluation[1].dispose();

    return {
      loss: loss[0],
      mae: mae[0],
      ...metrics
    };
  }

  async getModelSummary() {
    if (!this.model) return null;
    return this.model.summary();
  }
}

// Customer Segmentation using K-means clustering
export class CustomerSegmentation {
  constructor() {
    this.model = null;
    this.isTrained = false;
  }

  preprocessCustomerData(invoices) {
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

    // Calculate averages and features
    Object.values(customerMap).forEach(customer => {
      customer.avgInvoiceValue = customer.totalSpent / customer.invoiceCount;
      customer.uniqueItems = customer.items.size;
      customer.daysSinceLastPurchase = Math.floor((new Date() - customer.lastPurchase) / (1000 * 60 * 60 * 24));
    });

    return Object.values(customerMap);
  }

  async buildModel(k = 3) {
    this.k = k;
    this.model = tf.sequential({
      layers: [
        tf.layers.dense({
          units: 10,
          activation: 'relu',
          inputShape: [4]
        }),
        tf.layers.dense({
          units: k,
          activation: 'softmax'
        })
      ]
    });

    this.model.compile({
      optimizer: tf.train.adam(0.01),
      loss: 'categoricalCrossentropy',
      metrics: ['accuracy']
    });
  }

  async train(invoices, k = 3) {
    const customers = this.preprocessCustomerData(invoices);
    if (customers.length < k) {
      throw new Error(`Need at least ${k} customers for ${k}-clustering`);
    }

    // Prepare features
    const features = customers.map(customer => [
      customer.totalSpent / 10000, // Normalize total spent
      customer.invoiceCount / 10, // Normalize invoice count
      customer.avgInvoiceValue / 1000, // Normalize avg invoice value
      customer.daysSinceLastPurchase / 365 // Normalize days since last purchase
    ]);

    // Convert to tensors
    const xs = tf.tensor2d(features);
    
    // Create one-hot encoded targets for clustering
    const targets = tf.oneHot(tf.tensor1d(Array.from({length: customers.length}, (_, i) => i % k), 'int32'), k);

    await this.buildModel(k);
    
    const history = await this.model.fit(xs, targets, {
      epochs: 30, // Reduced epochs for faster training
      batchSize: 16,
      validationSplit: 0.2,
      verbose: 0
    });

    this.isTrained = true;
    this.customers = customers;
    this.features = features;

    // Clean up tensors
    xs.dispose();
    targets.dispose();

    return history;
  }

  async predictSegments() {
    if (!this.isTrained) {
      throw new Error('Model must be trained before prediction');
    }

    const xs = tf.tensor2d(this.features);
    const predictions = this.model.predict(xs);
    const segments = await predictions.argMax(1).data();

    const results = this.customers.map((customer, i) => ({
      ...customer,
      segment: segments[i]
    }));

    // Clean up tensors
    xs.dispose();
    predictions.dispose();

    return results;
  }
}

// Anomaly Detection for unusual invoices
export class AnomalyDetection {
  constructor() {
    this.model = null;
    this.isTrained = false;
    this.threshold = 0.95;
  }

  preprocessData(invoices) {
    return invoices.map(invoice => {
      const total = invoice.total || 0;
      const itemCount = invoice.items?.length || 0;
      const avgItemPrice = itemCount > 0 ? total / itemCount : 0;
      const maxItemPrice = Math.max(...(invoice.items?.map(item => item.price || 0) || [0]));
      
      return {
        total: total / 10000, // Normalize
        itemCount: itemCount / 10, // Normalize
        avgItemPrice: avgItemPrice / 1000, // Normalize
        maxItemPrice: maxItemPrice / 1000, // Normalize
        originalInvoice: invoice
      };
    });
  }

  async buildModel() {
    this.model = tf.sequential({
      layers: [
        tf.layers.dense({
          units: 8,
          activation: 'relu',
          inputShape: [4]
        }),
        tf.layers.dense({
          units: 4,
          activation: 'relu'
        }),
        tf.layers.dense({
          units: 8,
          activation: 'relu'
        }),
        tf.layers.dense({
          units: 4,
          activation: 'linear'
        })
      ]
    });

    this.model.compile({
      optimizer: tf.train.adam(0.001),
      loss: 'meanSquaredError'
    });
  }

  async train(invoices) {
    if (!invoices || invoices.length < 10) {
      throw new Error('Need at least 10 invoices for anomaly detection');
    }

    const data = this.preprocessData(invoices);
    const features = data.map(d => [d.total, d.itemCount, d.avgItemPrice, d.maxItemPrice]);

    const xs = tf.tensor2d(features);
    const ys = tf.tensor2d(features); // Autoencoder: input = output

    await this.buildModel();
    
    const history = await this.model.fit(xs, ys, {
      epochs: 50, // Reduced epochs for faster training
      batchSize: 16,
      validationSplit: 0.2,
      verbose: 0
    });

    this.isTrained = true;
    this.trainingData = data;

    // Clean up tensors
    xs.dispose();
    ys.dispose();

    return history;
  }

  async detectAnomalies(invoices) {
    if (!this.isTrained) {
      throw new Error('Model must be trained before anomaly detection');
    }

    const data = this.preprocessData(invoices);
    const features = data.map(d => [d.total, d.itemCount, d.avgItemPrice, d.maxItemPrice]);

    const xs = tf.tensor2d(features);
    const reconstructions = this.model.predict(xs);
    
    // Calculate reconstruction error
    const errors = xs.sub(reconstructions).square().mean(1);
    const errorValues = await errors.data();

    const anomalies = data.map((item, i) => ({
      ...item,
      reconstructionError: errorValues[i],
      isAnomaly: errorValues[i] > this.threshold,
      originalInvoice: item.originalInvoice
    }));

    // Clean up tensors
    xs.dispose();
    reconstructions.dispose();
    errors.dispose();

    return anomalies;
  }
}

// Utility function to get model performance metrics
export const calculateMetrics = (predictions, actuals) => {
  if (predictions.length !== actuals.length) {
    throw new Error('Predictions and actuals must have the same length');
  }

  const n = predictions.length;
  const mse = predictions.reduce((sum, pred, i) => sum + Math.pow(pred - actuals[i], 2), 0) / n;
  const rmse = Math.sqrt(mse);
  const mae = predictions.reduce((sum, pred, i) => sum + Math.abs(pred - actuals[i]), 0) / n;
  
  const meanActual = actuals.reduce((sum, val) => sum + val, 0) / n;
  const ssRes = predictions.reduce((sum, pred, i) => sum + Math.pow(pred - actuals[i], 2), 0);
  const ssTot = actuals.reduce((sum, val) => sum + Math.pow(val - meanActual, 2), 0);
  const r2 = 1 - (ssRes / ssTot);

  return {
    mse,
    rmse,
    mae,
    r2,
    meanAbsolutePercentageError: (mae / meanActual) * 100
  };
};

// Function to assess model quality and provide recommendations
export const assessModelQuality = (metrics, dataSize) => {
  const assessment = {
    overall: 'unknown',
    r2Score: 'unknown',
    dataQuality: 'unknown',
    recommendations: []
  };

  // Assess R² score
  if (metrics.r2 > 0.8) {
    assessment.r2Score = 'excellent';
  } else if (metrics.r2 > 0.6) {
    assessment.r2Score = 'good';
  } else if (metrics.r2 > 0.4) {
    assessment.r2Score = 'fair';
  } else {
    assessment.r2Score = 'poor';
  }

  // Assess data quality
  if (dataSize >= 50) {
    assessment.dataQuality = 'excellent';
  } else if (dataSize >= 20) {
    assessment.dataQuality = 'good';
  } else if (dataSize >= 10) {
    assessment.dataQuality = 'fair';
  } else {
    assessment.dataQuality = 'poor';
  }

  // Overall assessment
  if (assessment.r2Score === 'excellent' && assessment.dataQuality === 'excellent') {
    assessment.overall = 'excellent';
  } else if (assessment.r2Score === 'good' && assessment.dataQuality === 'good') {
    assessment.overall = 'good';
  } else if (assessment.r2Score === 'fair' || assessment.dataQuality === 'fair') {
    assessment.overall = 'fair';
  } else {
    assessment.overall = 'poor';
  }

  // Generate recommendations
  if (dataSize < 20) {
    assessment.recommendations.push('Collect more invoice data (aim for 20+ invoices)');
  }
  if (metrics.r2 < 0.6) {
    assessment.recommendations.push('Consider adding more features or improving data quality');
  }
  if (metrics.meanAbsolutePercentageError > 20) {
    assessment.recommendations.push('High prediction errors - review data consistency');
  }
  if (assessment.overall === 'excellent') {
    assessment.recommendations.push('Model is performing well - consider using for business decisions');
  }

  return assessment;
}; 
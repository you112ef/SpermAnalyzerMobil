import * as tf from '@tensorflow/tfjs';
import '@tensorflow/tfjs-react-native';
import '@tensorflow/tfjs-platform-react-native';

// Initialize TensorFlow.js for React Native
export const initializeTensorFlow = async () => {
  // Wait for tf to be ready
  await tf.ready();
  
  // Optional: Enable production mode
  tf.env().set('PROD', true);
  
  console.log('TensorFlow.js initialized for React Native');
  console.log('Backend:', tf.getBackend());
  console.log('Flags:', tf.env().flags);
  
  return true;
};

// Auto-initialize when this module is imported
initializeTensorFlow();
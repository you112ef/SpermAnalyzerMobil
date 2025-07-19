import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { Provider as PaperProvider } from 'react-native-paper';
import * as tf from '@tensorflow/tfjs';
import '@tensorflow/tfjs-react-native';

// Import screens
import HomeScreen from './src/screens/HomeScreen';
import CameraScreen from './src/screens/CameraScreen';
import ResultsScreen from './src/screens/ResultsScreen';
import HistoryScreen from './src/screens/HistoryScreen';

// Import theme
import { theme } from './src/theme/theme';

// Initialize TensorFlow
import './src/services/tfInit';

const Stack = createStackNavigator();

export default function App() {
  useEffect(() => {
    // Initialize TensorFlow.js
    tf.ready().then(() => {
      console.log('TensorFlow.js is ready!');
    });
  }, []);

  return (
    <PaperProvider theme={theme}>
      <NavigationContainer>
        <Stack.Navigator
          initialRouteName="Home"
          screenOptions={{
            headerShown: false,
            gestureEnabled: true,
          }}
        >
          <Stack.Screen name="Home" component={HomeScreen} />
          <Stack.Screen name="Camera" component={CameraScreen} />
          <Stack.Screen name="Results" component={ResultsScreen} />
          <Stack.Screen name="History" component={HistoryScreen} />
        </Stack.Navigator>
        <StatusBar style="auto" />
      </NavigationContainer>
    </PaperProvider>
  );
}
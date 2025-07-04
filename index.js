/**
 * @format
 */

import { AppRegistry } from 'react-native';
import App from './App';
import { name as appName } from './app.json';

// Initialize React Native Firebase
import '@react-native-firebase/app';

AppRegistry.registerComponent(appName, () => App);

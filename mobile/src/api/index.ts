import axios from 'axios';
import { Platform } from 'react-native';

// For Android emulator: 10.0.2.2, for iOS simulator: localhost, or device IP
export const API_BASE_URL = Platform.OS === 'android' ? 'http://10.0.2.2:8080/api' : 'http://localhost:8080/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export default api;

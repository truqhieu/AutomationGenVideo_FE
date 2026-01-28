import axios, { AxiosError } from 'axios';

const AI_API_URL = process.env.NEXT_PUBLIC_AI_API_URL || 'http://localhost:3000';

// Create axios instance for AI backend
export const aiApiClient = axios.create({
  baseURL: AI_API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 90000, // 90s timeout (backend has 60s, so frontend needs more)
});

// Response interceptor - handle errors
aiApiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    console.error('AI API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

export default aiApiClient;

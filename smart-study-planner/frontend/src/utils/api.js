/**
 * api.js — Axios API client
 * All calls to the FastAPI backend go through here.
 * Change BACKEND_URL to your deployed URL when deploying.
 */

import axios from 'axios'

// Base URL for the backend API
// During development: http://localhost:8000
// After deployment: replace with your Render/Railway URL
const BACKEND_URL = 'http://127.0.0.1:8000'

const api = axios.create({
  baseURL: BACKEND_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 seconds timeout
})

// ---- Request interceptor (for logging/debugging) ----
api.interceptors.request.use((config) => {
  console.log(`[API] ${config.method?.toUpperCase()} ${config.url}`)
  return config
})

// ---- Response error interceptor ----
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const msg = error.response?.data?.detail || error.message || 'Unknown error'
    console.error('[API Error]', msg)
    return Promise.reject(new Error(msg))
  }
)

/**
 * Generate a study schedule
 * @param {Object} payload - { subjects, daily_hours, start_date }
 * @returns {Promise<Object>} - Schedule response
 */
export const generateSchedule = async (payload) => {
  const response = await api.post('/generate-schedule', payload)
  return response.data
}

/**
 * Update progress (complete or skip a session)
 * @param {Object} payload - { session_id, status, subjects, daily_hours, start_date }
 * @returns {Promise<Object>} - Updated schedule response
 */
export const updateProgress = async (payload) => {
  const response = await api.post('/update-progress', payload)
  return response.data
}

/**
 * Get sample test data from the API
 * @returns {Promise<Object>} - Sample subject data
 */
export const getSampleData = async () => {
  const response = await api.get('/sample-data')
  return response.data
}

export default api

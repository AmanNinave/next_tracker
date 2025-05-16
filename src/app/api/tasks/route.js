'use client';

const API_URL = process.env.NEXT_PUBLIC_BACKEND_API;

// Helper function to get token (works in both client & server contexts)
const getToken = () => {
  try {
    if (typeof window !== 'undefined') {
      return localStorage.getItem("token");
    }
    return null;
  } catch (error) {
    return null;
  }
};

// Centralized API call handler with improved error handling
async function apiCall(url, method = "GET", body = null) {
  const token = getToken();
  
  if (!token) {
    const error = new Error("No token found");
    error.status = 401;
    error.redirect = true;
    throw error;
  }
  
  try {
    const options = {
      method,
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    };
    
    if (body) {
      options.body = JSON.stringify(body);
    }
    
    const res = await fetch(url, options);
    
    if (res.status === 401) {
      const error = new Error("Authentication expired or invalid");
      error.status = 401;
      error.redirect = true;
      throw error;
    }
    
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      const error = new Error(errorData.detail || `Request failed with status ${res.status}`);
      error.status = res.status;
      error.data = errorData;
      throw error;
    }
    
    return res.json();
  } catch (error) {
    // Rethrow with enhanced information if it's not already a structured error
    if (!error.status) {
      const enhancedError = new Error(`Network error: ${error.message}`);
      enhancedError.originalError = error;
      throw enhancedError;
    }
    throw error;
  }
}

// API functions using the centralized handler
export const fetchTasks = async () => {
  return apiCall(`${API_URL}/task`);
};

export const fetchTaskSchedules = async () => {
  return apiCall(`${API_URL}/task-schedule`);
};

export const createNewTask = async (payload) => {
  return apiCall(`${API_URL}/task`, "POST", payload);
};

export const createNewScheduleEntry = async (payload) => {
  return apiCall(`${API_URL}/task-schedule`, "POST", payload);
};

export const createNewLogEntry = async (payload) => {
  return apiCall(`${API_URL}/task-log`, "POST", payload);
};

export const updateLogEntry = async (id, payload) => {
  return apiCall(`${API_URL}/task-log/${id}`, "PUT", payload);
};
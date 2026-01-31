const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Helper function to make API requests
const apiRequest = async (endpoint, options = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;

  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };

  // Add authorization header if token exists
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  try {
    const response = await fetch(url, config);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'API request failed');
    }

    return data;
  } catch (error) {
    console.error('API Request Error:', error);
    throw error;
  }
};

// Authentication API
export const authAPI = {
  // Register a new user
  register: async (userData) => {
    return apiRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  },

  // Login user
  login: async (credentials) => {
    return apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  },

  // Get current user profile
  getProfile: async () => {
    return apiRequest('/auth/me');
  },

  // Logout user
  logout: async () => {
    return apiRequest('/auth/logout', {
      method: 'POST',
    });
  },

  // Update user profile
  updateProfile: async (profileData) => {
    return apiRequest('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(profileData),
    });
  },

  // Upload profile image
  uploadProfileImage: async (formData) => {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE_URL}/auth/profile-image`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Failed to upload image');
    }
    return data;
  },
};

// Verification API
export const verificationAPI = {
  // Send OTP for email verification
  sendOTP: async (email) => {
    return apiRequest('/verification/send-otp', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  },

  // Verify OTP
  verifyOTP: async (email, otp) => {
    return apiRequest('/verification/verify-otp', {
      method: 'POST',
      body: JSON.stringify({ email, otp }),
    });
  },

  // Resend OTP
  resendOTP: async (email) => {
    return apiRequest('/verification/resend-otp', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  },
};

// Utility functions
export const setAuthToken = (token) => {
  if (token) {
    localStorage.setItem('token', token);
  } else {
    localStorage.removeItem('token');
  }
};

export const getAuthToken = () => {
  return localStorage.getItem('token');
};

export const removeAuthToken = () => {
  localStorage.removeItem('token');
};

export const isAuthenticated = () => {
  const token = getAuthToken();
  if (!token) return false;

  try {
    // Check if token is expired (basic check)
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.exp * 1000 > Date.now();
  } catch {
    return false;
  }
};

// Staff Management API
export const staffAPI = {
  // Get all staff members
  getStaff: async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/staff`, {
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch staff members');
      }
      return data;
    } catch (error) {
      console.error('Error fetching staff:', error);
      throw error;
    }
  },

  // Get all users/patients
  getUsers: async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/staff/users`, {
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch users');
      }
      return data;
    } catch (error) {
      console.error('Error fetching users:', error);
      throw error;
    }
  },

  // Create new staff member
  createStaff: async (staffData) => {
    try {
      const response = await fetch(`${API_BASE_URL}/staff`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(staffData)
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to create staff member');
      }
      return data;
    } catch (error) {
      console.error('Error creating staff:', error);
      throw error;
    }
  },

  // Update staff member
  updateStaff: async (staffId, updateData) => {
    try {
      const response = await fetch(`${API_BASE_URL}/staff/${staffId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updateData)
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to update staff member');
      }
      return data;
    } catch (error) {
      console.error('Error updating staff:', error);
      throw error;
    }
  },

  // Delete staff member
  deleteStaff: async (staffId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/staff/${staffId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to delete staff member');
      }
      return data;
    } catch (error) {
      console.error('Error deleting staff:', error);
      throw error;
    }
  },

  // Get single staff member
  getStaffById: async (staffId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/staff/${staffId}`, {
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch staff member');
      }
      return data;
    } catch (error) {
      console.error('Error fetching staff member:', error);
      throw error;
    }
  },

  // Update user block status
  updateUserBlockStatus: async (userId, blockData) => {
    try {
      const response = await fetch(`${API_BASE_URL}/staff/user/${userId}/block`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(blockData)
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to update user block status');
      }
      return data;
    } catch (error) {
      console.error('Error updating user block status:', error);
      throw error;
    }
  }
};

// Test and Package Management API
export const testAPI = {
  // Get all tests
  getTests: async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/tests`, {
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch tests');
      }
      return data;
    } catch (error) {
      console.error('Error fetching tests:', error);
      throw error;
    }
  },

  // Get single test by id
  getTestById: async (testId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/tests/${testId}`, {
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch test');
      }
      return data;
    } catch (error) {
      console.error('Error fetching test:', error);
      throw error;
    }
  },

  // Create new test
  createTest: async (testData) => {
    try {
      const formData = new FormData();

      // Add all fields to form data
      Object.keys(testData).forEach(key => {
        const value = testData[key];
        if (key === 'image' && value) {
          formData.append('image', value);
          return;
        }
        if (key === 'imagePreview' || value === null || value === undefined) return;
        // Serialize arrays/objects so backend can parse JSON strings
        const isObjectLike = typeof value === 'object';
        formData.append(key, isObjectLike ? JSON.stringify(value) : value);
      });

      const response = await fetch(`${API_BASE_URL}/tests`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`,
        },
        body: formData
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to create test');
      }
      return data;
    } catch (error) {
      console.error('Error creating test:', error);
      throw error;
    }
  },

  // Update test
  updateTest: async (testId, testData) => {
    try {
      const formData = new FormData();

      // Add all fields to form data
      Object.keys(testData).forEach(key => {
        const value = testData[key];
        if (key === 'image' && value) {
          formData.append('image', value);
          return;
        }
        if (key === 'imagePreview' || value === null || value === undefined) return;
        const isObjectLike = typeof value === 'object';
        formData.append(key, isObjectLike ? JSON.stringify(value) : value);
      });

      const response = await fetch(`${API_BASE_URL}/tests/${testId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`,
        },
        body: formData
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to update test');
      }
      return data;
    } catch (error) {
      console.error('Error updating test:', error);
      throw error;
    }
  },

  // Delete test
  deleteTest: async (testId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/tests/${testId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to delete test');
      }
      return data;
    } catch (error) {
      console.error('Error deleting test:', error);
      throw error;
    }
  }
};

// Package Management API
export const packageAPI = {
  // Get all packages
  getPackages: async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/packages`, {
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch packages');
      }
      return data;
    } catch (error) {
      console.error('Error fetching packages:', error);
      throw error;
    }
  },

  // Create new package
  createPackage: async (packageData) => {
    try {
      const formData = new FormData();

      // Add all fields to form data
      Object.keys(packageData).forEach(key => {
        const value = packageData[key];
        if (key === 'image' && value) {
          formData.append('image', value);
          return;
        }
        if (key === 'imagePreview' || value === null || value === undefined) return;
        // special-case selectedTests as multiple fields for common backends
        if (key === 'selectedTests' && Array.isArray(value)) {
          value.forEach(v => formData.append('selectedTests[]', v));
          return;
        }
        const isObjectLike = typeof value === 'object';
        formData.append(key, isObjectLike ? JSON.stringify(value) : value);
      });

      const response = await fetch(`${API_BASE_URL}/packages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`,
        },
        body: formData
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to create package');
      }
      return data;
    } catch (error) {
      console.error('Error creating package:', error);
      throw error;
    }
  },

  // Update package
  updatePackage: async (packageId, packageData) => {
    try {
      const formData = new FormData();

      // Add all fields to form data
      Object.keys(packageData).forEach(key => {
        const value = packageData[key];
        if (key === 'image' && value) {
          formData.append('image', value);
          return;
        }
        if (key === 'imagePreview' || value === null || value === undefined) return;
        if (key === 'selectedTests' && Array.isArray(value)) {
          value.forEach(v => formData.append('selectedTests[]', v));
          return;
        }
        const isObjectLike = typeof value === 'object';
        formData.append(key, isObjectLike ? JSON.stringify(value) : value);
      });

      const response = await fetch(`${API_BASE_URL}/packages/${packageId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`,
        },
        body: formData
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to update package');
      }
      return data;
    } catch (error) {
      console.error('Error updating package:', error);
      throw error;
    }
  },

  // Delete package
  deletePackage: async (packageId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/packages/${packageId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to delete package');
      }
      return data;
    } catch (error) {
      console.error('Error deleting package:', error);
      throw error;
    }
  }
};


// Booking API
export const bookingAPI = {
  // Create new booking
  createBooking: async (bookingData) => {
    try {
      const response = await fetch(`${API_BASE_URL}/bookings`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(bookingData)
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to create booking');
      }
      return data;
    } catch (error) {
      console.error('Error creating booking:', error);
      throw error;
    }
  },

  // Upload prescription
  uploadPrescription: async (file) => {
    try {
      const formData = new FormData();
      formData.append('prescriptionFile', file);

      const response = await fetch(`${API_BASE_URL}/bookings/upload-prescription`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`
        },
        body: formData
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to upload prescription');
      }
      return data;
    } catch (error) {
      console.error('Error uploading prescription:', error);
      throw error;
    }
  },

  // Get user's bookings
  getBookings: async (status = 'all', page = 1, limit = 10) => {
    try {
      const response = await fetch(`${API_BASE_URL}/bookings?status=${status}&page=${page}&limit=${limit}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch bookings');
      }
      return data;
    } catch (error) {
      console.error('Error fetching bookings:', error);
      throw error;
    }
  },

  // Get single booking
  getBooking: async (bookingId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/bookings/${bookingId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch booking');
      }
      return data;
    } catch (error) {
      console.error('Error fetching booking:', error);
      throw error;
    }
  },

  // Update booking
  updateBooking: async (bookingId, updateData) => {
    try {
      const response = await fetch(`${API_BASE_URL}/bookings/${bookingId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updateData)
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to update booking');
      }
      return data;
    } catch (error) {
      console.error('Error updating booking:', error);
      throw error;
    }
  },

  // Process payment
  processPayment: async (bookingId, paymentData) => {
    try {
      const response = await fetch(`${API_BASE_URL}/bookings/${bookingId}/payment`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(paymentData)
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to process payment');
      }
      return data;
    } catch (error) {
      console.error('Error processing payment:', error);
      throw error;
    }
  },

  // Cancel booking
  cancelBooking: async (bookingId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/bookings/${bookingId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to cancel booking');
      }
      return data;
    } catch (error) {
      console.error('Error cancelling booking:', error);
      throw error;
    }
  },



  // Upload report for booking
  uploadReport: async (bookingId, reportFile) => {
    try {
      const formData = new FormData();
      formData.append('reportFile', reportFile);

      const response = await fetch(`${API_BASE_URL}/bookings/${bookingId}/upload-report`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`
        },
        body: formData
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to upload report');
      }
      return data;
    } catch (error) {
      console.error('Error uploading report:', error);
      throw error;
    }
  },



  // Process payment for booking
  processPayment: async (bookingId, paymentData = {}) => {
    try {
      const response = await fetch(`${API_BASE_URL}/bookings/${bookingId}/payment`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(paymentData)
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to process payment');
      }
      return data;
    } catch (error) {
      console.error('Error processing payment:', error);
      throw error;
    }
  },

  // Create Razorpay order
  createOrder: async (bookingId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/bookings/${bookingId}/create-order`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to create order');
      }
      return data;
    } catch (error) {
      console.error('Error creating order:', error);
      throw error;
    }
  },

  // Admin: Get all bookings
  getAdminBookings: async (queryParams = '') => {
    try {
      const response = await fetch(`${API_BASE_URL}/bookings/admin/all?${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`,
          'Content-Type': 'application/json',
        },
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch admin bookings');
      }
      return data;
    } catch (error) {
      console.error('Error fetching admin bookings:', error);
      throw error;
    }
  },

  // Update booking status (works for both admin and staff)
  updateBookingStatus: async (id, statusOrData) => {
    try {
      // Get user info to determine the correct endpoint
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const isAdmin = user.role === 'admin';

      // Use admin endpoint for admin users, regular endpoint for staff/local admin
      const endpoint = isAdmin
        ? `${API_BASE_URL}/bookings/admin/${id}/status`
        : `${API_BASE_URL}/bookings/${id}/status`;

      // Handle both string status and object data
      const bodyData = typeof statusOrData === 'string'
        ? { status: statusOrData }
        : statusOrData;

      const response = await fetch(endpoint, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(bodyData),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to update booking status');
      }
      return data;
    } catch (error) {
      console.error('Error updating booking status:', error);
      throw error;
    }
  },

  // Admin: Delete booking
  deleteBooking: async (id) => {
    try {
      const response = await fetch(`${API_BASE_URL}/bookings/admin/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`,
          'Content-Type': 'application/json',
        },
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to delete booking');
      }
      return data;
    } catch (error) {
      console.error('Error deleting booking:', error);
      throw error;
    }
  },

  // Process payment for booking (supports both Razorpay and lab payments)
  processPayment: async (bookingId, paymentData = {}) => {
    try {
      const response = await fetch(`${API_BASE_URL}/bookings/${bookingId}/payment`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(paymentData),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to process payment');
      }
      return data;
    } catch (error) {
      console.error('Error processing payment:', error);
      throw error;
    }
  },

  // Get lab reports (for staff)
  getLabReports: async (labId, status = 'all', page = 1, limit = 50) => {
    try {
      const response = await fetch(`${API_BASE_URL}/bookings/lab/${labId}/reports?status=${status}&page=${page}&limit=${limit}`, {
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`,
          'Content-Type': 'application/json',
        },
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch lab reports');
      }
      return data;
    } catch (error) {
      console.error('Error fetching lab reports:', error);
      throw error;
    }
  }

};

// Results API for bookings
export const resultsAPI = {
  // Submit results JSON for a booking
  submitResults: async (bookingId, testResults) => {
    try {
      const response = await fetch(`${API_BASE_URL}/bookings/${bookingId}/results`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ testResults })
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to submit results');
      }
      return data;
    } catch (error) {
      console.error('Error submitting results:', error);
      throw error;
    }
  }
};

// Lab API
export const labAPI = {
  // Get all labs
  getLabs: async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/labs`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch labs');
      }
      return data;
    } catch (error) {
      console.error('Error fetching labs:', error);
      throw error;
    }
  },

  // Get lab by ID
  getLab: async (labId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/labs/${labId}`, {
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch lab');
      }
      return data;
    } catch (error) {
      console.error('Error fetching lab:', error);
      throw error;
    }
  },

  // Create new lab
  createLab: async (labData) => {
    try {
      console.log('API: Creating lab with data:', labData);

      const jsonData = JSON.stringify(labData);
      console.log('API: JSON stringified data:', jsonData);

      // Test if JSON is valid
      try {
        JSON.parse(jsonData);
        console.log('API: JSON is valid');
      } catch (jsonError) {
        console.error('API: Invalid JSON:', jsonError);
        throw new Error('Invalid JSON data');
      }

      const response = await fetch(`${API_BASE_URL}/labs`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`,
          'Content-Type': 'application/json'
        },
        body: jsonData
      });

      console.log('API: Response status:', response.status);

      const data = await response.json();
      console.log('API: Response data:', data);

      if (!response.ok) {
        throw new Error(data.message || 'Failed to create lab');
      }
      return data;
    } catch (error) {
      console.error('Error creating lab:', error);
      throw error;
    }
  },

  // Update lab
  updateLab: async (labId, labData) => {
    try {
      const response = await fetch(`${API_BASE_URL}/labs/${labId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(labData)
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to update lab');
      }
      return data;
    } catch (error) {
      console.error('Error updating lab:', error);
      throw error;
    }
  },

  // Delete lab
  deleteLab: async (labId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/labs/${labId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to delete lab');
      }
      return data;
    } catch (error) {
      console.error('Error deleting lab:', error);
      throw error;
    }
  }
};

// Local Admin API
export const localAdminAPI = {
  // Get staff members for a specific lab
  getLabStaff: async (labId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/staff/lab/${labId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch lab staff');
      }
      return data;
    } catch (error) {
      console.error('Error fetching lab staff:', error);
      throw error;
    }
  },

  // Get tests for a specific lab
  getLabTests: async (labId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/tests/lab/${labId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch lab tests');
      }
      return data;
    } catch (error) {
      console.error('Error fetching lab tests:', error);
      throw error;
    }
  },

  // Get available tests for lab assignment
  getAvailableTests: async (labId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/tests/available/lab/${labId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch available tests');
      }
      return data;
    } catch (error) {
      console.error('Error fetching available tests:', error);
      throw error;
    }
  },

  // Assign tests to lab
  assignTestsToLab: async (labId, testIds) => {
    try {
      const response = await fetch(`${API_BASE_URL}/tests/lab/${labId}/assign`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ testIds })
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to assign tests to lab');
      }
      return data;
    } catch (error) {
      console.error('Error assigning tests to lab:', error);
      throw error;
    }
  },

  // Get packages for a specific lab
  getLabPackages: async (labId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/packages/lab/${labId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch lab packages');
      }
      return data;
    } catch (error) {
      console.error('Error fetching lab packages:', error);
      throw error;
    }
  },

  // Get available packages for lab assignment
  getAvailablePackages: async (labId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/packages/available/lab/${labId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch available packages');
      }
      return data;
    } catch (error) {
      console.error('Error fetching available packages:', error);
      throw error;
    }
  },

  // Assign packages to lab
  assignPackagesToLab: async (labId, packageIds) => {
    try {
      const response = await fetch(`${API_BASE_URL}/packages/lab/${labId}/assign`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ packageIds })
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to assign packages to lab');
      }
      return data;
    } catch (error) {
      console.error('Error assigning packages to lab:', error);
      throw error;
    }
  },

  // Get bookings for a specific lab
  getLabBookings: async (labId, status = 'all', page = 1, limit = 10, filters = {}) => {
    try {
      const params = new URLSearchParams({
        status,
        page: page.toString(),
        limit: limit.toString(),
        ...filters
      });

      const response = await fetch(`${API_BASE_URL}/bookings/lab/${labId}?${params}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch lab bookings');
      }
      return data;
    } catch (error) {
      console.error('Error fetching lab bookings:', error);
      throw error;
    }
  },

  // Create staff member for a specific lab
  createLabStaff: async (labId, staffData) => {
    try {
      const response = await fetch(`${API_BASE_URL}/staff/lab/${labId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(staffData)
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to create staff member');
      }
      return data;
    } catch (error) {
      console.error('Error creating staff member:', error);
      throw error;
    }
  },

  // Update staff member for a specific lab
  updateLabStaff: async (labId, staffId, staffData) => {
    try {
      const response = await fetch(`${API_BASE_URL}/staff/lab/${labId}/${staffId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(staffData)
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to update staff member');
      }
      return data;
    } catch (error) {
      console.error('Error updating staff member:', error);
      throw error;
    }
  },

  // Delete staff member for a specific lab
  deleteLabStaff: async (labId, staffId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/staff/lab/${labId}/${staffId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to delete staff member');
      }
      return data;
    } catch (error) {
      console.error('Error deleting staff member:', error);
      throw error;
    }
  },

  // Create test for a specific lab
  createLabTest: async (labId, testData) => {
    try {
      const response = await fetch(`${API_BASE_URL}/tests/lab/${labId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(testData)
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to create test');
      }
      return data;
    } catch (error) {
      console.error('Error creating test:', error);
      throw error;
    }
  },

  // Update test for a specific lab
  updateLabTest: async (labId, testId, testData) => {
    try {
      const response = await fetch(`${API_BASE_URL}/tests/lab/${labId}/${testId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(testData)
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to update test');
      }
      return data;
    } catch (error) {
      console.error('Error updating test:', error);
      throw error;
    }
  },

  // Delete test for a specific lab
  deleteLabTest: async (labId, testId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/tests/lab/${labId}/${testId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to delete test');
      }
      return data;
    } catch (error) {
      console.error('Error deleting test:', error);
      throw error;
    }
  },

  // Create package for a specific lab
  createLabPackage: async (labId, packageData) => {
    try {
      const response = await fetch(`${API_BASE_URL}/packages/lab/${labId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(packageData)
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to create package');
      }
      return data;
    } catch (error) {
      console.error('Error creating package:', error);
      throw error;
    }
  },

  // Update package for a specific lab
  updateLabPackage: async (labId, packageId, packageData) => {
    try {
      const response = await fetch(`${API_BASE_URL}/packages/lab/${labId}/${packageId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(packageData)
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to update package');
      }
      return data;
    } catch (error) {
      console.error('Error updating package:', error);
      throw error;
    }
  },

  // Delete package for a specific lab
  deleteLabPackage: async (labId, packageId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/packages/lab/${labId}/${packageId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to delete package');
      }
      return data;
    } catch (error) {
      console.error('Error deleting package:', error);
      throw error;
    }
  }
};

// Message API for support and communication
export const messageAPI = {
  // Send a new message
  sendMessage: async (messageData) => {
    try {
      const response = await fetch(`${API_BASE_URL}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(getAuthToken() ? { 'Authorization': `Bearer ${getAuthToken()}` } : {})
        },
        body: JSON.stringify(messageData)
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to send message');
      }
      return data;
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  },

  // Get all messages (Staff/Admin)
  getMessages: async (status = 'all', page = 1, limit = 20) => {
    try {
      const params = new URLSearchParams({
        status,
        page: page.toString(),
        limit: limit.toString()
      });

      const response = await fetch(`${API_BASE_URL}/messages?${params}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch messages');
      }
      return data;
    } catch (error) {
      console.error('Error fetching messages:', error);
      throw error;
    }
  },

  // Update message status
  updateMessageStatus: async (id, status) => {
    try {
      const response = await fetch(`${API_BASE_URL}/messages/${id}/status`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status })
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to update message status');
      }
      return data;
    } catch (error) {
      console.error('Error update message status:', error);
      throw error;
    }
  }
};

// Check if email exists
export const checkEmailExists = async (email) => {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/check-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email }),
    });
    const data = await response.json();
    return data.exists || false;
  } catch (error) {
    console.error('Error checking email:', error);
    return false;
  }
};

// Google OAuth API
export const googleAuthAPI = {
  // Initiate Google OAuth flow
  initiateGoogleAuth: () => {
    const backendUrl = API_BASE_URL;
    window.location.href = `${backendUrl}/auth/google`;
  },

  // Handle Google OAuth success callback
  handleGoogleCallback: async (token, userData) => {
    try {
      // Store token and user data
      localStorage.setItem('authToken', token);
      localStorage.setItem('user', JSON.stringify(userData));

      return {
        success: true,
        data: {
          user: userData,
          token: token
        }
      };
    } catch (error) {
      console.error('Error handling Google callback:', error);
      throw error;
    }
  }
};

// Admin API
export const adminAPI = {
  // Get comprehensive analytics data
  getAnalytics: async (params = {}) => {
    try {
      const queryString = new URLSearchParams(params).toString();
      const response = await fetch(`${API_BASE_URL}/admin/analytics?${queryString}`, {
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`,
          'Content-Type': 'application/json',
        },
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch analytics');
      }
      return data;
    } catch (error) {
      console.error('Error fetching analytics:', error);
      throw error;
    }
  },

  // Get dashboard statistics
  getDashboardStats: async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/dashboard-stats`, {
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`,
          'Content-Type': 'application/json',
        },
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch dashboard stats');
      }
      return data;
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      throw error;
    }
  },

  // Export reports
  exportReports: async (format = 'json', period = '30') => {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/reports/export?format=${format}&period=${period}`, {
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`,
          'Content-Type': 'application/json',
        },
      });

      if (format === 'csv') {
        // Handle CSV download
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `bookings-${period}-days.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        return { success: true, message: 'CSV exported successfully' };
      } else {
        // Handle JSON response
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.message || 'Failed to export reports');
        }
        return data;
      }
    } catch (error) {
      console.error('Error exporting reports:', error);
      throw error;
    }
  }
};

export const respiratoryAPI = {
  // Submit new assessment
  submitAssessment: async (data) => {
    return apiRequest('/respiratory/assess', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  // Get assessment history
  getHistory: async () => {
    return apiRequest('/respiratory/history');
  }
};

export default {
  authAPI,
  verificationAPI,
  staffAPI,
  testAPI,
  packageAPI,
  labAPI,
  bookingAPI,
  resultsAPI,
  localAdminAPI,
  adminAPI,
  messageAPI,
  googleAuthAPI,
  respiratoryAPI,
  setAuthToken,
  getAuthToken,
  removeAuthToken,
  isAuthenticated,
};

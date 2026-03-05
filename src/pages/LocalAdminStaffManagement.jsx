import React, { useState, useEffect } from 'react'
import { Plus, Edit, Trash2, User, Mail, Phone, Building2, Search, Filter } from 'lucide-react'
import Swal from 'sweetalert2'
import api from '../services/api'

const LocalAdminStaffManagement = ({ assignedLab }) => {
  const [staffMembers, setStaffMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [selectedStaff, setSelectedStaff] = useState(null)

  const [newStaff, setNewStaff] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    role: 'staff',
    department: '',
    password: '',
    confirmPassword: '',
    useRandomPassword: true
  })

  const [error, setError] = useState('')

  // Generate random password function
  const generateRandomPassword = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*'
    let password = ''
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return password
  }

  // Handle password generation toggle
  const handlePasswordToggle = (useRandom) => {
    if (useRandom) {
      const randomPassword = generateRandomPassword()
      setNewStaff(prev => ({
        ...prev,
        useRandomPassword: true,
        password: randomPassword,
        confirmPassword: randomPassword
      }))
    } else {
      setNewStaff(prev => ({
        ...prev,
        useRandomPassword: false,
        password: '',
        confirmPassword: ''
      }))
    }
  }

  // Fetch staff members for the assigned lab
  useEffect(() => {
    if (assignedLab && assignedLab._id) {
      fetchStaffMembers()
    }
  }, [assignedLab])

  const fetchStaffMembers = async () => {
    try {
      setLoading(true)
      const response = await api.localAdminAPI.getLabStaff(assignedLab._id)

      if (response.success) {
        setStaffMembers(response.data)
      }
    } catch (error) {
      console.error('Error fetching staff members:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddStaff = async (e) => {
    e.preventDefault()
    try {
      setError('')

      // Validate password
      if (!newStaff.useRandomPassword) {
        if (!newStaff.password || !newStaff.confirmPassword) {
          setError('Password and confirm password are required')
          return
        }
        if (newStaff.password !== newStaff.confirmPassword) {
          setError('Passwords do not match')
          return
        }
        if (newStaff.password.length < 6) {
          setError('Password must be at least 6 characters long')
          return
        }
      }

      const response = await api.localAdminAPI.createLabStaff(assignedLab._id, newStaff)

      if (response.success) {
        setShowAddModal(false)
        setNewStaff({
          firstName: '',
          lastName: '',
          email: '',
          phone: '',
          role: 'staff',
          department: '',
          password: '',
          confirmPassword: '',
          useRandomPassword: true
        })
        setError('')
        fetchStaffMembers()
        Swal.mixin({ toast: true, position: 'top-end', showConfirmButton: false, timer: 3500, timerProgressBar: true })
          .fire({ icon: 'success', title: 'Staff member created!', text: 'Welcome email sent to the new staff member.' });
      }
    } catch (error) {
      console.error('Error creating staff:', error)
      Swal.fire({ icon: 'error', title: 'Failed to Create Staff', text: error.message, confirmButtonColor: '#ef4444' });
    }
  }

  const handleEditStaff = async (e) => {
    e.preventDefault()
    try {
      const response = await api.localAdminAPI.updateLabStaff(assignedLab._id, selectedStaff._id, selectedStaff)

      if (response.success) {
        setShowEditModal(false)
        setSelectedStaff(null)
        fetchStaffMembers()
        Swal.mixin({ toast: true, position: 'top-end', showConfirmButton: false, timer: 3000, timerProgressBar: true })
          .fire({ icon: 'success', title: 'Staff member updated!' });
      }
    } catch (error) {
      console.error('Error updating staff:', error)
      Swal.fire({ icon: 'error', title: 'Update Failed', text: error.message, confirmButtonColor: '#ef4444' });
    }
  }

  const handleDeleteStaff = async (staffId) => {
    const result = await Swal.fire({
      title: 'Delete Staff Member?',
      text: 'This action cannot be undone. The staff member will lose access to the system.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, Delete',
    });
    if (!result.isConfirmed) return;
    try {
      const response = await api.localAdminAPI.deleteLabStaff(assignedLab._id, staffId)
      if (response.success) {
        fetchStaffMembers()
        Swal.mixin({ toast: true, position: 'top-end', showConfirmButton: false, timer: 3000, timerProgressBar: true })
          .fire({ icon: 'success', title: 'Staff member deleted.' });
      }
    } catch (error) {
      console.error('Error deleting staff:', error)
      Swal.fire({ icon: 'error', title: 'Delete Failed', text: error.message, confirmButtonColor: '#ef4444' });
    }
  }

  // Filter staff members based on search term
  const filteredStaff = staffMembers.filter(staff => {
    const searchLower = searchTerm.toLowerCase()
    return (
      staff.firstName.toLowerCase().includes(searchLower) ||
      staff.lastName.toLowerCase().includes(searchLower) ||
      staff.email.toLowerCase().includes(searchLower) ||
      staff.role.toLowerCase().includes(searchLower)
    )
  })

  const getRoleColor = (role) => {
    switch (role) {
      case 'staff':
        return 'bg-blue-100 text-blue-800'
      case 'lab_technician':
        return 'bg-green-100 text-green-800'
      case 'xray_technician':
        return 'bg-purple-100 text-purple-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Staff Management</h2>
          <p className="text-gray-600">Manage staff members for {assignedLab?.name}</p>
        </div>
        <button
          onClick={() => {
            // Initialize with random password
            const randomPassword = generateRandomPassword()
            setNewStaff({
              firstName: '',
              lastName: '',
              email: '',
              phone: '',
              role: 'staff',
              department: '',
              password: randomPassword,
              confirmPassword: randomPassword,
              useRandomPassword: true
            })
            setError('')
            setShowAddModal(true)
          }}
          className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 flex items-center"
        >
          <Plus className="h-5 w-5 mr-2" />
          Add Staff
        </button>
      </div>

      {/* Search */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <div className="flex items-center space-x-2">
          <Search className="h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search staff members..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2 flex-1 focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
      </div>

      {/* Staff List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {filteredStaff.length === 0 ? (
          <div className="text-center py-12">
            <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No staff members found</h3>
            <p className="text-gray-600">
              {searchTerm ? 'No staff members match your search criteria.' : 'No staff members assigned to this lab.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Staff Member
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Department
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredStaff.map((staff) => (
                  <tr key={staff._id} className="hover:bg-gray-50">
                    {/* Staff Info */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
                            <User className="h-5 w-5 text-primary-600" />
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {staff.firstName} {staff.lastName}
                          </div>
                          <div className="text-sm text-gray-500">ID: {staff._id.slice(-8)}</div>
                        </div>
                      </div>
                    </td>

                    {/* Role */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoleColor(staff.role)}`}>
                        {staff.role.replace('_', ' ').toUpperCase()}
                      </span>
                    </td>

                    {/* Department */}
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {staff.department || 'Not assigned'}
                    </td>

                    {/* Contact */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        <div className="flex items-center">
                          <Mail className="h-4 w-4 text-gray-400 mr-2" />
                          {staff.email}
                        </div>
                        <div className="flex items-center mt-1">
                          <Phone className="h-4 w-4 text-gray-400 mr-2" />
                          {staff.phone}
                        </div>
                      </div>
                    </td>

                    {/* Status */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${staff.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                        {staff.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      <button
                        onClick={() => {
                          setSelectedStaff(staff)
                          setShowEditModal(true)
                        }}
                        className="text-primary-600 hover:text-primary-900 flex items-center"
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteStaff(staff._id)}
                        className="text-red-600 hover:text-red-900 flex items-center"
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Staff Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Add New Staff Member</h3>
            <form onSubmit={handleAddStaff} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder="First Name"
                  value={newStaff.firstName}
                  onChange={(e) => setNewStaff({ ...newStaff, firstName: e.target.value })}
                  className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  required
                />
                <input
                  type="text"
                  placeholder="Last Name"
                  value={newStaff.lastName}
                  onChange={(e) => setNewStaff({ ...newStaff, lastName: e.target.value })}
                  className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  required
                />
              </div>
              <input
                type="email"
                placeholder="Email"
                value={newStaff.email}
                onChange={(e) => setNewStaff({ ...newStaff, email: e.target.value })}
                className="border border-gray-300 rounded-md px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-primary-500"
                required
              />
              <input
                type="tel"
                placeholder="Phone"
                value={newStaff.phone}
                onChange={(e) => setNewStaff({ ...newStaff, phone: e.target.value })}
                className="border border-gray-300 rounded-md px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-primary-500"
                required
              />
              <select
                value={newStaff.role}
                onChange={(e) => setNewStaff({ ...newStaff, role: e.target.value })}
                className="border border-gray-300 rounded-md px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="staff">Staff</option>
                <option value="lab_technician">Lab Technician</option>
                <option value="xray_technician">X-Ray Technician</option>
              </select>
              <input
                type="text"
                placeholder="Department"
                value={newStaff.department}
                onChange={(e) => setNewStaff({ ...newStaff, department: e.target.value })}
                className="border border-gray-300 rounded-md px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              {/* Error Message */}
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                  {error}
                </div>
              )}

              {/* Password Options */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Password Options</label>
                <div className="space-y-3">
                  {/* Random Password Option */}
                  <div className="flex items-center space-x-3">
                    <input
                      type="radio"
                      id="randomPassword"
                      name="passwordOption"
                      checked={newStaff.useRandomPassword}
                      onChange={() => handlePasswordToggle(true)}
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300"
                    />
                    <label htmlFor="randomPassword" className="text-sm font-medium text-gray-700">
                      Generate Random Password
                    </label>
                  </div>

                  {/* Custom Password Option */}
                  <div className="flex items-center space-x-3">
                    <input
                      type="radio"
                      id="customPassword"
                      name="passwordOption"
                      checked={!newStaff.useRandomPassword}
                      onChange={() => handlePasswordToggle(false)}
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300"
                    />
                    <label htmlFor="customPassword" className="text-sm font-medium text-gray-700">
                      Set Custom Password
                    </label>
                  </div>
                </div>

                {/* Password Display/Input */}
                {newStaff.useRandomPassword ? (
                  <div className="mt-3">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Generated Password</label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="text"
                        value={newStaff.password}
                        readOnly
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-900 font-mono text-sm"
                      />
                      <button
                        type="button"
                        onClick={() => handlePasswordToggle(true)}
                        className="px-3 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors text-sm"
                      >
                        Regenerate
                      </button>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">This password will be sent to the staff member via email</p>
                  </div>
                ) : (
                  <div className="mt-3 space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                      <input
                        type="password"
                        value={newStaff.password}
                        onChange={(e) => setNewStaff({ ...newStaff, password: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        placeholder="Enter password"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
                      <input
                        type="password"
                        value={newStaff.confirmPassword}
                        onChange={(e) => setNewStaff({ ...newStaff, confirmPassword: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        placeholder="Confirm password"
                      />
                    </div>
                  </div>
                )}
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
                >
                  Add Staff
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Staff Modal */}
      {showEditModal && selectedStaff && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Edit Staff Member</h3>
            <form onSubmit={handleEditStaff} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder="First Name"
                  value={selectedStaff.firstName}
                  onChange={(e) => setSelectedStaff({ ...selectedStaff, firstName: e.target.value })}
                  className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  required
                />
                <input
                  type="text"
                  placeholder="Last Name"
                  value={selectedStaff.lastName}
                  onChange={(e) => setSelectedStaff({ ...selectedStaff, lastName: e.target.value })}
                  className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  required
                />
              </div>
              <input
                type="email"
                placeholder="Email"
                value={selectedStaff.email}
                onChange={(e) => setSelectedStaff({ ...selectedStaff, email: e.target.value })}
                className="border border-gray-300 rounded-md px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-primary-500"
                required
              />
              <input
                type="tel"
                placeholder="Phone"
                value={selectedStaff.phone}
                onChange={(e) => setSelectedStaff({ ...selectedStaff, phone: e.target.value })}
                className="border border-gray-300 rounded-md px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-primary-500"
                required
              />
              <select
                value={selectedStaff.role}
                onChange={(e) => setSelectedStaff({ ...selectedStaff, role: e.target.value })}
                className="border border-gray-300 rounded-md px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="staff">Staff</option>
                <option value="lab_technician">Lab Technician</option>
                <option value="xray_technician">X-Ray Technician</option>
              </select>
              <input
                type="text"
                placeholder="Department"
                value={selectedStaff.department || ''}
                onChange={(e) => setSelectedStaff({ ...selectedStaff, department: e.target.value })}
                className="border border-gray-300 rounded-md px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
                >
                  Update Staff
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default LocalAdminStaffManagement
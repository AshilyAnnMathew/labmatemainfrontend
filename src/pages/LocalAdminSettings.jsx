import React, { useState, useEffect } from 'react'
import { Building2, MapPin, Phone, Mail, Clock, Users, Save, Edit } from 'lucide-react'
import Swal from 'sweetalert2'
import api from '../services/api'

const LocalAdminSettings = ({ assignedLab }) => {
  const [labData, setLabData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    address: {
      street: '',
      city: '',
      state: '',
      zipCode: '',
      country: ''
    },
    contact: {
      phone: '',
      email: '',
      website: ''
    },
    operatingHours: {
      monday: { open: '', close: '', closed: false },
      tuesday: { open: '', close: '', closed: false },
      wednesday: { open: '', close: '', closed: false },
      thursday: { open: '', close: '', closed: false },
      friday: { open: '', close: '', closed: false },
      saturday: { open: '', close: '', closed: false },
      sunday: { open: '', close: '', closed: false }
    },
    capacity: {
      dailyCapacity: '',
      currentBookings: ''
    }
  })

  useEffect(() => {
    if (assignedLab && assignedLab._id) {
      fetchLabDetails()
    }
  }, [assignedLab])

  const fetchLabDetails = async () => {
    try {
      setLoading(true)
      const response = await api.labAPI.getLab(assignedLab._id)
      if (response.success) {
        setLabData(response.data)
        setFormData({
          name: response.data.name || '',
          description: response.data.description || '',
          address: {
            street: response.data.address?.street || '',
            city: response.data.address?.city || '',
            state: response.data.address?.state || '',
            zipCode: response.data.address?.zipCode || '',
            country: response.data.address?.country || ''
          },
          contact: {
            phone: response.data.contact?.phone || '',
            email: response.data.contact?.email || '',
            website: response.data.contact?.website || ''
          },
          operatingHours: response.data.operatingHours || formData.operatingHours,
          capacity: {
            dailyCapacity: response.data.capacity?.dailyCapacity || '',
            currentBookings: response.data.capacity?.currentBookings || ''
          }
        })
      }
    } catch (error) {
      console.error('Error fetching lab details:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (section, field, value) => {
    if (section === 'operatingHours') {
      setFormData(prev => ({
        ...prev,
        operatingHours: {
          ...prev.operatingHours,
          [field]: {
            ...prev.operatingHours[field],
            ...value
          }
        }
      }))
    } else if (section === 'address' || section === 'contact' || section === 'capacity') {
      setFormData(prev => ({
        ...prev,
        [section]: {
          ...prev[section],
          [field]: value
        }
      }))
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }))
    }
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      const response = await api.labAPI.updateLab(assignedLab._id, formData)
      if (response.success) {
        setEditing(false)
        setLabData(response.data)
        Swal.mixin({ toast: true, position: 'top-end', showConfirmButton: false, timer: 3000, timerProgressBar: true })
          .fire({ icon: 'success', title: 'Lab settings updated successfully!' });
      }
    } catch (error) {
      console.error('Error updating lab:', error)
      Swal.fire({ icon: 'error', title: 'Update Failed', text: 'Error updating lab settings. Please try again.', confirmButtonColor: '#ef4444' });
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    if (labData) {
      setFormData({
        name: labData.name || '',
        description: labData.description || '',
        address: {
          street: labData.address?.street || '',
          city: labData.address?.city || '',
          state: labData.address?.state || '',
          zipCode: labData.address?.zipCode || '',
          country: labData.address?.country || ''
        },
        contact: {
          phone: labData.contact?.phone || '',
          email: labData.contact?.email || '',
          website: labData.contact?.website || ''
        },
        operatingHours: labData.operatingHours || formData.operatingHours,
        capacity: {
          dailyCapacity: labData.capacity?.dailyCapacity || '',
          currentBookings: labData.capacity?.currentBookings || ''
        }
      })
    }
    setEditing(false)
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
          <h2 className="text-2xl font-bold text-gray-900">Lab Settings</h2>
          <p className="text-gray-600">Manage settings for {assignedLab?.name}</p>
        </div>
        <div className="flex space-x-3">
          {editing ? (
            <>
              <button
                onClick={handleCancel}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 flex items-center disabled:opacity-50"
              >
                {saving ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </>
          ) : (
            <button
              onClick={() => setEditing(true)}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 flex items-center"
            >
              <Edit className="h-4 w-4 mr-2" />
              Edit Settings
            </button>
          )}
        </div>
      </div>

      {/* Lab Information */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center mb-6">
          <Building2 className="h-6 w-6 text-primary-600 mr-3" />
          <h3 className="text-lg font-medium text-gray-900">Lab Information</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Lab Name
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleInputChange('', 'name', e.target.value)}
              disabled={!editing}
              className="border border-gray-300 rounded-md px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:bg-gray-50"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => handleInputChange('', 'description', e.target.value)}
              disabled={!editing}
              rows="3"
              className="border border-gray-300 rounded-md px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:bg-gray-50"
            />
          </div>
        </div>
      </div>

      {/* Address Information */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center mb-6">
          <MapPin className="h-6 w-6 text-primary-600 mr-3" />
          <h3 className="text-lg font-medium text-gray-900">Address</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Street Address
            </label>
            <input
              type="text"
              value={formData.address.street}
              onChange={(e) => handleInputChange('address', 'street', e.target.value)}
              disabled={!editing}
              className="border border-gray-300 rounded-md px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:bg-gray-50"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              City
            </label>
            <input
              type="text"
              value={formData.address.city}
              onChange={(e) => handleInputChange('address', 'city', e.target.value)}
              disabled={!editing}
              className="border border-gray-300 rounded-md px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:bg-gray-50"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              State
            </label>
            <input
              type="text"
              value={formData.address.state}
              onChange={(e) => handleInputChange('address', 'state', e.target.value)}
              disabled={!editing}
              className="border border-gray-300 rounded-md px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:bg-gray-50"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              ZIP Code
            </label>
            <input
              type="text"
              value={formData.address.zipCode}
              onChange={(e) => handleInputChange('address', 'zipCode', e.target.value)}
              disabled={!editing}
              className="border border-gray-300 rounded-md px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:bg-gray-50"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Country
            </label>
            <input
              type="text"
              value={formData.address.country}
              onChange={(e) => handleInputChange('address', 'country', e.target.value)}
              disabled={!editing}
              className="border border-gray-300 rounded-md px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:bg-gray-50"
            />
          </div>
        </div>
      </div>

      {/* Contact Information */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center mb-6">
          <Phone className="h-6 w-6 text-primary-600 mr-3" />
          <h3 className="text-lg font-medium text-gray-900">Contact Information</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Phone Number
            </label>
            <input
              type="tel"
              value={formData.contact.phone}
              onChange={(e) => handleInputChange('contact', 'phone', e.target.value)}
              disabled={!editing}
              className="border border-gray-300 rounded-md px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:bg-gray-50"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email
            </label>
            <input
              type="email"
              value={formData.contact.email}
              onChange={(e) => handleInputChange('contact', 'email', e.target.value)}
              disabled={!editing}
              className="border border-gray-300 rounded-md px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:bg-gray-50"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Website
            </label>
            <input
              type="url"
              value={formData.contact.website}
              onChange={(e) => handleInputChange('contact', 'website', e.target.value)}
              disabled={!editing}
              className="border border-gray-300 rounded-md px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:bg-gray-50"
            />
          </div>
        </div>
      </div>

      {/* Operating Hours */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center mb-6">
          <Clock className="h-6 w-6 text-primary-600 mr-3" />
          <h3 className="text-lg font-medium text-gray-900">Operating Hours</h3>
        </div>

        <div className="space-y-4">
          {Object.entries(formData.operatingHours).map(([day, hours]) => (
            <div key={day} className="flex items-center space-x-4">
              <div className="w-24">
                <label className="block text-sm font-medium text-gray-700 capitalize">
                  {day}
                </label>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={hours.closed}
                  onChange={(e) => handleInputChange('operatingHours', day, { closed: e.target.checked })}
                  disabled={!editing}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded disabled:bg-gray-50"
                />
                <span className="text-sm text-gray-700">Closed</span>
              </div>

              {!hours.closed && (
                <div className="flex items-center space-x-2">
                  <input
                    type="time"
                    value={hours.open}
                    onChange={(e) => handleInputChange('operatingHours', day, { open: e.target.value })}
                    disabled={!editing}
                    className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:bg-gray-50"
                  />
                  <span className="text-gray-500">to</span>
                  <input
                    type="time"
                    value={hours.close}
                    onChange={(e) => handleInputChange('operatingHours', day, { close: e.target.value })}
                    disabled={!editing}
                    className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:bg-gray-50"
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Capacity */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center mb-6">
          <Users className="h-6 w-6 text-primary-600 mr-3" />
          <h3 className="text-lg font-medium text-gray-900">Capacity</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Daily Capacity
            </label>
            <input
              type="number"
              value={formData.capacity.dailyCapacity}
              onChange={(e) => handleInputChange('capacity', 'dailyCapacity', e.target.value)}
              disabled={!editing}
              className="border border-gray-300 rounded-md px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:bg-gray-50"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Current Bookings
            </label>
            <input
              type="number"
              value={formData.capacity.currentBookings}
              onChange={(e) => handleInputChange('capacity', 'currentBookings', e.target.value)}
              disabled={!editing}
              className="border border-gray-300 rounded-md px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:bg-gray-50"
            />
          </div>
        </div>
      </div>
    </div>
  )
}

export default LocalAdminSettings
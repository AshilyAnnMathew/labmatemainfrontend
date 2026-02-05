import { Routes, Route, Navigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import {
  LayoutDashboard,
  TestTube,
  Building2,
  Users,
  Calendar,
  BarChart3,
  Settings as SettingsIcon, // Fixed Settings import
  Plus,
  Edit,
  Trash2,
  UserCheck,
  UserPlus,
  Mail,
  Phone,
  MapPin,
  Search,
  Filter,
  Download,
  Upload,
  Loader,
  AlertCircle
} from 'lucide-react'
import Swal from 'sweetalert2'
import DashboardLayout from '../layouts/DashboardLayout'
import PlaceholderPage from '../components/common/PlaceholderPage'
import ManageLabs from './ManageLabs'
import AdminBookings from './AdminBookings'
import AdminReports from './AdminReports'
import AdminOverview from '../components/dashboard/AdminOverview'
import AdminSettings from '../components/dashboard/AdminSettings'
import api from '../services/api'
const { staffAPI, testAPI, packageAPI, labAPI } = api

const AdminDashboard = () => {
  const sidebarItems = [
    {
      path: '/admin/dashboard',
      label: 'Dashboard Overview',
      icon: LayoutDashboard
    },
    {
      path: '/admin/dashboard/tests',
      label: 'Manage Tests & Packages',
      icon: TestTube
    },
    {
      path: '/admin/dashboard/labs',
      label: 'Manage Labs',
      icon: Building2
    },
    {
      path: '/admin/dashboard/users',
      label: 'Manage Users & Staff',
      icon: Users
    },
    {
      path: '/admin/dashboard/bookings',
      label: 'View Bookings',
      icon: Calendar
    },
    {
      path: '/admin/dashboard/reports',
      label: 'Reports & Analytics',
      icon: BarChart3
    },
    {
      path: '/admin/dashboard/settings',
      label: 'Settings',
      icon: SettingsIcon
    }
  ]



  const ManageTests = () => {
    const [activeTab, setActiveTab] = useState('tests')
    const [showAddTestModal, setShowAddTestModal] = useState(false)
    const [showAddPackageModal, setShowAddPackageModal] = useState(false)
    const [showEditTestModal, setShowEditTestModal] = useState(false)
    const [showEditPackageModal, setShowEditPackageModal] = useState(false)
    const [selectedTest, setSelectedTest] = useState(null)
    const [selectedPackage, setSelectedPackage] = useState(null)
    const [searchTerm, setSearchTerm] = useState('')
    const [filterCategory, setFilterCategory] = useState('all')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [fieldErrors, setFieldErrors] = useState({})

    // Data states
    const [tests, setTests] = useState([])
    const [packages, setPackages] = useState([])

    // Test form state
    const [newTest, setNewTest] = useState({
      name: '',
      description: '',
      category: '',
      price: '',
      duration: '',
      preparation: '',
      resultFields: [],
      image: null,
      imagePreview: null
    })

    // Package form state
    const [newPackage, setNewPackage] = useState({
      name: '',
      description: '',
      price: '',
      discount: '',
      selectedTests: [],
      duration: '',
      benefits: '',
      image: null,
      imagePreview: null
    })

    // Fetch data on component mount
    useEffect(() => {
      const token = localStorage.getItem('token')
      if (token) {
        fetchTests()
        fetchPackages()
      } else {
        setError('Please log in to access this page')
      }
    }, [])

    const fetchTests = async () => {
      try {
        setLoading(true)
        setError('')
        const response = await testAPI.getTests()
        setTests(response.data || [])
      } catch (err) {
        const errorMessage = err.message || 'Failed to fetch tests'
        setError(errorMessage)
        console.error('Error fetching tests:', err)
      } finally {
        setLoading(false)
      }
    }

    const fetchPackages = async () => {
      try {
        const response = await packageAPI.getPackages()
        setPackages(response.data || [])
      } catch (err) {
        console.error('Error fetching packages:', err)
      }
    }

    // Handle image upload for tests
    const handleImageUpload = (e) => {
      const file = e.target.files[0]
      if (file) {
        if (file.size > 5 * 1024 * 1024) { // 5MB limit
          setError('Image size must be less than 5MB')
          return
        }

        const reader = new FileReader()
        reader.onload = (e) => {
          setNewTest(prev => ({
            ...prev,
            image: file,
            imagePreview: e.target.result
          }))
        }
        reader.readAsDataURL(file)
      }
    }

    // Handle image upload for packages
    const handlePackageImageUpload = (e) => {
      const file = e.target.files[0]
      if (file) {
        if (file.size > 5 * 1024 * 1024) { // 5MB limit
          setError('Image size must be less than 5MB')
          return
        }

        const reader = new FileReader()
        reader.onload = (e) => {
          setNewPackage(prev => ({
            ...prev,
            image: file,
            imagePreview: e.target.result
          }))
        }
        reader.readAsDataURL(file)
      }
    }

    // Handle add test
    const handleAddTest = async () => {
      try {
        setLoading(true)
        setError('')
        setFieldErrors({})

        // Validate required fields
        const errors = {}
        if (!newTest.name) errors.name = 'Test name is required'
        if (!newTest.description) errors.description = 'Description is required'
        if (!newTest.category) errors.category = 'Category is required'
        if (!newTest.price) errors.price = 'Price is required'
        if (!newTest.duration) errors.duration = 'Duration is required'

        if (Object.keys(errors).length > 0) {
          setFieldErrors(errors)
          setLoading(false)
          return
        }

        // Create test (includes resultFields if provided)
        const response = await testAPI.createTest(newTest)

        // Refresh tests list
        await fetchTests()

        // Close modal and reset form
        setShowAddTestModal(false)
        setNewTest({
          name: '',
          description: '',
          category: '',
          price: '',
          duration: '',
          preparation: '',
          resultFields: [],
          image: null,
          imagePreview: null
        })

        // Show success message
        await Swal.fire({
          icon: 'success',
          title: 'Success!',
          text: 'Test created successfully!',
          confirmButtonColor: '#2563eb',
          confirmButtonText: 'OK'
        })

      } catch (err) {
        let errorMessage = 'Failed to create test'
        if (err.message) {
          errorMessage = err.message
        }
        setError(errorMessage)
        console.error('Error creating test:', err)
      } finally {
        setLoading(false)
      }
    }

    // Handle update test
    const handleUpdateTest = async () => {
      try {
        setLoading(true)
        setError('')
        setFieldErrors({})

        // Validate required fields
        const errors = {}
        if (!newTest.name) errors.name = 'Test name is required'
        if (!newTest.description) errors.description = 'Description is required'
        if (!newTest.category) errors.category = 'Category is required'
        if (!newTest.price) errors.price = 'Price is required'
        if (!newTest.duration) errors.duration = 'Duration is required'

        if (Object.keys(errors).length > 0) {
          setFieldErrors(errors)
          setLoading(false)
          return
        }

        // Update test (includes resultFields if provided)
        const response = await testAPI.updateTest(selectedTest._id, newTest)

        // Refresh tests list
        await fetchTests()

        // Close modal and reset form
        setShowEditTestModal(false)
        setSelectedTest(null)
        setNewTest({
          name: '',
          description: '',
          category: '',
          price: '',
          duration: '',
          preparation: '',
          resultFields: [],
          image: null,
          imagePreview: null
        })

        // Show success message
        await Swal.fire({
          icon: 'success',
          title: 'Success!',
          text: 'Test updated successfully!',
          confirmButtonColor: '#2563eb',
          confirmButtonText: 'OK'
        })

      } catch (err) {
        let errorMessage = 'Failed to update test'
        if (err.message) {
          errorMessage = err.message
        }
        setError(errorMessage)
        console.error('Error updating test:', err)
      } finally {
        setLoading(false)
      }
    }

    // Handle update package
    const handleUpdatePackage = async () => {
      try {
        setLoading(true)
        setError('')
        setFieldErrors({})

        // Validate required fields
        const errors = {}
        if (!newPackage.name) errors.name = 'Package name is required'
        if (!newPackage.description) errors.description = 'Description is required'
        if (!newPackage.price) errors.price = 'Price is required'
        if (newPackage.selectedTests.length === 0) errors.selectedTests = 'At least one test must be selected'

        if (Object.keys(errors).length > 0) {
          setFieldErrors(errors)
          setLoading(false)
          return
        }

        // Update package
        const response = await packageAPI.updatePackage(selectedPackage._id, newPackage)

        // Refresh packages list
        await fetchPackages()

        // Close modal and reset form
        setShowEditPackageModal(false)
        setSelectedPackage(null)
        setNewPackage({
          name: '',
          description: '',
          price: '',
          discount: '',
          selectedTests: [],
          duration: '',
          benefits: '',
          image: null,
          imagePreview: null
        })

        // Show success message
        await Swal.fire({
          icon: 'success',
          title: 'Success!',
          text: 'Package updated successfully!',
          confirmButtonColor: '#2563eb',
          confirmButtonText: 'OK'
        })

      } catch (err) {
        let errorMessage = 'Failed to update package'
        if (err.message) {
          errorMessage = err.message
        }
        setError(errorMessage)
        console.error('Error updating package:', err)
      } finally {
        setLoading(false)
      }
    }

    // Handle add package
    const handleAddPackage = async () => {
      try {
        setLoading(true)
        setError('')
        setFieldErrors({})

        // Validate required fields
        const errors = {}
        if (!newPackage.name) errors.name = 'Package name is required'
        if (!newPackage.description) errors.description = 'Description is required'
        if (!newPackage.price) errors.price = 'Price is required'
        if (newPackage.selectedTests.length === 0) errors.selectedTests = 'At least one test must be selected'

        if (Object.keys(errors).length > 0) {
          setFieldErrors(errors)
          setLoading(false)
          return
        }

        // Create package
        const response = await packageAPI.createPackage(newPackage)

        // Refresh packages list
        await fetchPackages()

        // Close modal and reset form
        setShowAddPackageModal(false)
        setNewPackage({
          name: '',
          description: '',
          price: '',
          discount: '',
          selectedTests: [],
          duration: '',
          benefits: '',
          image: null,
          imagePreview: null
        })

        // Show success message
        await Swal.fire({
          icon: 'success',
          title: 'Success!',
          text: 'Package created successfully!',
          confirmButtonColor: '#2563eb',
          confirmButtonText: 'OK'
        })

      } catch (err) {
        let errorMessage = 'Failed to create package'
        if (err.message) {
          errorMessage = err.message
        }
        setError(errorMessage)
        console.error('Error creating package:', err)
      } finally {
        setLoading(false)
      }
    }

    // Handle delete test
    const handleDeleteTest = async (test) => {
      const result = await Swal.fire({
        title: 'Delete Test?',
        text: `Are you sure you want to delete "${test.name}"? This action cannot be undone.`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#dc2626',
        cancelButtonColor: '#6b7280',
        confirmButtonText: 'Yes, delete it!',
        cancelButtonText: 'Cancel',
        reverseButtons: true
      })

      if (result.isConfirmed) {
        try {
          await testAPI.deleteTest(test._id)
          await fetchTests()
          await Swal.fire({
            icon: 'success',
            title: 'Deleted!',
            text: 'Test deleted successfully!',
            confirmButtonColor: '#2563eb',
            confirmButtonText: 'OK'
          })
        } catch (err) {
          Swal.fire({
            icon: 'error',
            title: 'Error!',
            text: err.message || 'Failed to delete test',
            confirmButtonColor: '#dc2626',
            confirmButtonText: 'OK'
          })
        }
      }
    }

    // Handle delete package
    const handleDeletePackage = async (packageItem) => {
      const result = await Swal.fire({
        title: 'Delete Package?',
        text: `Are you sure you want to delete "${packageItem.name}"? This action cannot be undone.`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#dc2626',
        cancelButtonColor: '#6b7280',
        confirmButtonText: 'Yes, delete it!',
        cancelButtonText: 'Cancel',
        reverseButtons: true
      })

      if (result.isConfirmed) {
        try {
          await packageAPI.deletePackage(packageItem._id)
          await fetchPackages()
          await Swal.fire({
            icon: 'success',
            title: 'Deleted!',
            text: 'Package deleted successfully!',
            confirmButtonColor: '#2563eb',
            confirmButtonText: 'OK'
          })
        } catch (err) {
          Swal.fire({
            icon: 'error',
            title: 'Error!',
            text: err.message || 'Failed to delete package',
            confirmButtonColor: '#dc2626',
            confirmButtonText: 'OK'
          })
        }
      }
    }

    // Toggle test selection for package
    const toggleTestSelection = (testId) => {
      setNewPackage(prev => ({
        ...prev,
        selectedTests: prev.selectedTests.includes(testId)
          ? prev.selectedTests.filter(id => id !== testId)
          : [...prev.selectedTests, testId]
      }))
    }

    // Result fields handlers for tests
    const addResultField = () => {
      setNewTest(prev => ({
        ...prev,
        resultFields: [
          ...((prev.resultFields) || []),
          { label: '', unit: '', referenceRange: '', type: 'text', required: false }
        ]
      }))
    }

    const updateResultField = (index, key, value) => {
      setNewTest(prev => {
        const updated = [...(prev.resultFields || [])]
        updated[index] = { ...updated[index], [key]: value }
        return { ...prev, resultFields: updated }
      })
    }

    const removeResultField = (index) => {
      setNewTest(prev => {
        const updated = [...(prev.resultFields || [])]
        updated.splice(index, 1)
        return { ...prev, resultFields: updated }
      })
    }

    // Filter tests
    const filteredTests = tests.filter(test => {
      const matchesSearch = test.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        test.description.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesCategory = filterCategory === 'all' || test.category === filterCategory
      return matchesSearch && matchesCategory
    })

    // Filter packages
    const filteredPackages = packages.filter(packageItem => {
      return packageItem.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        packageItem.description.toLowerCase().includes(searchTerm.toLowerCase())
    })

    return (
      <div className="p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Manage Tests & Packages</h1>
          <p className="text-gray-600">Configure laboratory tests and create pricing packages</p>
        </div>

        {/* Tab Navigation */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('tests')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${activeTab === 'tests'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
              >
                <TestTube className="h-4 w-4 inline mr-2" />
                Tests ({tests.length})
              </button>
              <button
                onClick={() => setActiveTab('packages')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${activeTab === 'packages'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
              >
                <BarChart3 className="h-4 w-4 inline mr-2" />
                Packages ({packages.length})
              </button>
            </nav>
          </div>
        </div>

        {/* Tests Tab */}
        {activeTab === 'tests' && (
          <div>
            {/* Tests Actions Bar */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="relative">
                    <Search className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search tests..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 w-full sm:w-64"
                    />
                  </div>
                  <select
                    value={filterCategory}
                    onChange={(e) => setFilterCategory(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="all">All Categories</option>
                    <option value="blood">Blood Tests</option>
                    <option value="urine">Urine Tests</option>
                    <option value="imaging">Imaging</option>
                    <option value="cardiology">Cardiology</option>
                    <option value="pathology">Pathology</option>
                  </select>
                </div>
                <button
                  onClick={() => setShowAddTestModal(true)}
                  className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Test
                </button>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 flex items-center">
                <AlertCircle className="h-5 w-5 mr-2" />
                {error}
              </div>
            )}

            {/* Tests Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {loading ? (
                <div className="col-span-full flex items-center justify-center py-12">
                  <Loader className="h-8 w-8 animate-spin mr-3" />
                  Loading tests...
                </div>
              ) : filteredTests.length === 0 ? (
                <div className="col-span-full text-center py-12 text-gray-500">
                  No tests found
                </div>
              ) : (
                filteredTests.map((test) => (
                  <div key={test._id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
                    {test.image && (
                      <div className="h-48 bg-gray-200 flex items-center justify-center">
                        <img
                          src={test.image.startsWith('http') ? test.image : `http://localhost:5000/${test.image}`}
                          alt={test.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <div className="p-6">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 mb-1">{test.name}</h3>
                          <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800 capitalize">
                            {test.category}
                          </span>
                        </div>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => {
                              setSelectedTest(test)
                              setNewTest({
                                name: test.name,
                                description: test.description,
                                category: test.category,
                                price: test.price,
                                duration: test.duration,
                                preparation: test.preparation || '',
                                resultFields: Array.isArray(test.resultFields) ? test.resultFields : [],
                                image: null,
                                imagePreview: test.image ? (test.image.startsWith('http') ? test.image : `http://localhost:5000/${test.image}`) : null
                              })
                              setShowEditTestModal(true)
                            }}
                            className="text-primary-600 hover:text-primary-900"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteTest(test)}
                            className="text-red-600 hover:text-red-900"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                      <p className="text-gray-600 text-sm mb-4 line-clamp-3">{test.description}</p>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500">Duration: {test.duration}</span>
                        <span className="font-semibold text-primary-600">₹{test.price}</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Packages Tab */}
        {activeTab === 'packages' && (
          <div>
            {/* Packages Actions Bar */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="relative">
                  <Search className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search packages..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 w-full sm:w-64"
                  />
                </div>
                <button
                  onClick={() => setShowAddPackageModal(true)}
                  className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Package
                </button>
              </div>
            </div>

            {/* Packages Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {loading ? (
                <div className="col-span-full flex items-center justify-center py-12">
                  <Loader className="h-8 w-8 animate-spin mr-3" />
                  Loading packages...
                </div>
              ) : filteredPackages.length === 0 ? (
                <div className="col-span-full text-center py-12 text-gray-500">
                  No packages found
                </div>
              ) : (
                filteredPackages.map((packageItem) => (
                  <div key={packageItem._id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
                    {packageItem.image && (
                      <div className="h-48 bg-gray-200 flex items-center justify-center">
                        <img
                          src={packageItem.image.startsWith('http') ? packageItem.image : `http://localhost:5000/${packageItem.image}`}
                          alt={packageItem.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <div className="p-6">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 mb-1">{packageItem.name}</h3>
                          <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                            {packageItem.selectedTests.length} Tests
                          </span>
                        </div>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => {
                              setSelectedPackage(packageItem)
                              setNewPackage({
                                name: packageItem.name,
                                description: packageItem.description,
                                price: packageItem.price,
                                discount: packageItem.discount || '',
                                selectedTests: packageItem.selectedTests.map(test => typeof test === 'string' ? test : test._id),
                                duration: packageItem.duration || '',
                                benefits: packageItem.benefits || '',
                                image: null,
                                imagePreview: packageItem.image ? (packageItem.image.startsWith('http') ? packageItem.image : `http://localhost:5000/${packageItem.image}`) : null
                              })
                              setShowEditPackageModal(true)
                            }}
                            className="text-primary-600 hover:text-primary-900"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeletePackage(packageItem)}
                            className="text-red-600 hover:text-red-900"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                      <p className="text-gray-600 text-sm mb-4 line-clamp-3">{packageItem.description}</p>

                      {/* Display selected tests */}
                      {packageItem.selectedTests && packageItem.selectedTests.length > 0 && (
                        <div className="mb-3">
                          <p className="text-xs font-medium text-gray-700 mb-1">Included Tests:</p>
                          <div className="flex flex-wrap gap-1">
                            {packageItem.selectedTests.slice(0, 3).map((test, index) => (
                              <span key={index} className="inline-flex px-2 py-0.5 text-xs bg-blue-50 text-blue-700 rounded">
                                {typeof test === 'string' ? test : test.name}
                              </span>
                            ))}
                            {packageItem.selectedTests.length > 3 && (
                              <span className="inline-flex px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded">
                                +{packageItem.selectedTests.length - 3} more
                              </span>
                            )}
                          </div>
                        </div>
                      )}

                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-500">Tests: {packageItem.selectedTests.length}</span>
                          <span className="font-semibold text-primary-600">₹{packageItem.price}</span>
                        </div>
                        {packageItem.discount && (
                          <div className="text-sm text-green-600">
                            Save ₹{packageItem.discount}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Add Test Modal */}
        {showAddTestModal && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-10 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900">Add New Test</h3>
                  <button
                    onClick={() => setShowAddTestModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <span className="sr-only">Close</span>
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Test Name</label>
                    <input
                      type="text"
                      value={newTest.name}
                      onChange={(e) => {
                        setNewTest({ ...newTest, name: e.target.value })
                        if (fieldErrors.name) {
                          setFieldErrors(prev => ({ ...prev, name: '' }))
                        }
                      }}
                      className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${fieldErrors.name ? 'border-red-300 bg-red-50' : 'border-gray-300'
                        }`}
                    />
                    {fieldErrors.name && (
                      <p className="text-red-600 text-xs mt-1">{fieldErrors.name}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <textarea
                      value={newTest.description}
                      onChange={(e) => {
                        setNewTest({ ...newTest, description: e.target.value })
                        if (fieldErrors.description) {
                          setFieldErrors(prev => ({ ...prev, description: '' }))
                        }
                      }}
                      rows={3}
                      className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${fieldErrors.description ? 'border-red-300 bg-red-50' : 'border-gray-300'
                        }`}
                    />
                    {fieldErrors.description && (
                      <p className="text-red-600 text-xs mt-1">{fieldErrors.description}</p>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                      <select
                        value={newTest.category}
                        onChange={(e) => {
                          setNewTest({ ...newTest, category: e.target.value })
                          if (fieldErrors.category) {
                            setFieldErrors(prev => ({ ...prev, category: '' }))
                          }
                        }}
                        className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${fieldErrors.category ? 'border-red-300 bg-red-50' : 'border-gray-300'
                          }`}
                      >
                        <option value="">Select Category</option>
                        <option value="blood">Blood Tests</option>
                        <option value="urine">Urine Tests</option>
                        <option value="imaging">Imaging</option>
                        <option value="cardiology">Cardiology</option>
                        <option value="pathology">Pathology</option>
                      </select>
                      {fieldErrors.category && (
                        <p className="text-red-600 text-xs mt-1">{fieldErrors.category}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Price (₹)</label>
                      <input
                        type="number"
                        value={newTest.price}
                        onChange={(e) => {
                          setNewTest({ ...newTest, price: e.target.value })
                          if (fieldErrors.price) {
                            setFieldErrors(prev => ({ ...prev, price: '' }))
                          }
                        }}
                        className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${fieldErrors.price ? 'border-red-300 bg-red-50' : 'border-gray-300'
                          }`}
                        placeholder="0.00"
                      />
                      {fieldErrors.price && (
                        <p className="text-red-600 text-xs mt-1">{fieldErrors.price}</p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Duration</label>
                      <input
                        type="text"
                        value={newTest.duration}
                        onChange={(e) => {
                          setNewTest({ ...newTest, duration: e.target.value })
                          if (fieldErrors.duration) {
                            setFieldErrors(prev => ({ ...prev, duration: '' }))
                          }
                        }}
                        className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${fieldErrors.duration ? 'border-red-300 bg-red-50' : 'border-gray-300'
                          }`}
                        placeholder="e.g., 24-48 hours"
                      />
                      {fieldErrors.duration && (
                        <p className="text-red-600 text-xs mt-1">{fieldErrors.duration}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Test Image</label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      />
                    </div>
                  </div>

                  {newTest.imagePreview && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Image Preview</label>
                      <div className="w-32 h-32 border border-gray-300 rounded-md overflow-hidden">
                        <img
                          src={newTest.imagePreview}
                          alt="Preview"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </div>
                  )}

                  {/* Result Fields */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-sm font-medium text-gray-700">Result Fields</label>
                      <button
                        type="button"
                        onClick={addResultField}
                        className="text-sm px-2 py-1 bg-primary-600 text-white rounded hover:bg-primary-700"
                      >
                        Add Field
                      </button>
                    </div>
                    {(newTest.resultFields && newTest.resultFields.length > 0) ? (
                      <div className="space-y-3">
                        {newTest.resultFields.map((field, idx) => (
                          <div key={idx} className="grid grid-cols-12 gap-2 items-end">
                            <div className="col-span-3">
                              <label className="block text-xs font-medium text-gray-700 mb-1">Label</label>
                              <input
                                type="text"
                                value={field.label}
                                onChange={(e) => updateResultField(idx, 'label', e.target.value)}
                                className="w-full px-2 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                placeholder="e.g., Hemoglobin"
                              />
                            </div>
                            <div className="col-span-2">
                              <label className="block text-xs font-medium text-gray-700 mb-1">Unit</label>
                              <input
                                type="text"
                                value={field.unit}
                                onChange={(e) => updateResultField(idx, 'unit', e.target.value)}
                                className="w-full px-2 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                placeholder="g/dL"
                              />
                            </div>
                            <div className="col-span-4">
                              <label className="block text-xs font-medium text-gray-700 mb-1">Reference Range</label>
                              <input
                                type="text"
                                value={field.referenceRange}
                                onChange={(e) => updateResultField(idx, 'referenceRange', e.target.value)}
                                className="w-full px-2 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                placeholder="13.5 - 17.5"
                              />
                            </div>
                            <div className="col-span-2">
                              <label className="block text-xs font-medium text-gray-700 mb-1">Type</label>
                              <select
                                value={field.type || 'text'}
                                onChange={(e) => updateResultField(idx, 'type', e.target.value)}
                                className="w-full px-2 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                              >
                                <option value="text">Text</option>
                                <option value="number">Number</option>
                                <option value="boolean">Yes/No</option>
                              </select>
                            </div>
                            <div className="col-span-1 flex items-center">
                              <input
                                id={`req-${idx}`}
                                type="checkbox"
                                checked={!!field.required}
                                onChange={(e) => updateResultField(idx, 'required', e.target.checked)}
                                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded mr-2"
                              />
                              <label htmlFor={`req-${idx}`} className="text-xs text-gray-700">Req</label>
                            </div>
                            <div className="col-span-12 flex justify-end">
                              <button
                                type="button"
                                onClick={() => removeResultField(idx)}
                                className="text-red-600 text-xs hover:text-red-800"
                              >
                                Remove
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-gray-500">No fields added yet.</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Preparation Instructions</label>
                    <textarea
                      value={newTest.preparation}
                      onChange={(e) => setNewTest({ ...newTest, preparation: e.target.value })}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      placeholder="e.g., Fasting required for 12 hours"
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    onClick={() => setShowAddTestModal(false)}
                    className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAddTest}
                    disabled={loading}
                    className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                  >
                    {loading ? (
                      <>
                        <Loader className="h-4 w-4 mr-2 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      'Add Test'
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Add Package Modal */}
        {showAddPackageModal && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-10 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900">Add New Package</h3>
                  <button
                    onClick={() => setShowAddPackageModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <span className="sr-only">Close</span>
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Package Name</label>
                    <input
                      type="text"
                      value={newPackage.name}
                      onChange={(e) => {
                        setNewPackage({ ...newPackage, name: e.target.value })
                        if (fieldErrors.name) {
                          setFieldErrors(prev => ({ ...prev, name: '' }))
                        }
                      }}
                      className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${fieldErrors.name ? 'border-red-300 bg-red-50' : 'border-gray-300'
                        }`}
                    />
                    {fieldErrors.name && (
                      <p className="text-red-600 text-xs mt-1">{fieldErrors.name}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <textarea
                      value={newPackage.description}
                      onChange={(e) => {
                        setNewPackage({ ...newPackage, description: e.target.value })
                        if (fieldErrors.description) {
                          setFieldErrors(prev => ({ ...prev, description: '' }))
                        }
                      }}
                      rows={3}
                      className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${fieldErrors.description ? 'border-red-300 bg-red-50' : 'border-gray-300'
                        }`}
                    />
                    {fieldErrors.description && (
                      <p className="text-red-600 text-xs mt-1">{fieldErrors.description}</p>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Package Price (₹)</label>
                      <input
                        type="number"
                        value={newPackage.price}
                        onChange={(e) => {
                          setNewPackage({ ...newPackage, price: e.target.value })
                          if (fieldErrors.price) {
                            setFieldErrors(prev => ({ ...prev, price: '' }))
                          }
                        }}
                        className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${fieldErrors.price ? 'border-red-300 bg-red-50' : 'border-gray-300'
                          }`}
                        placeholder="0.00"
                      />
                      {fieldErrors.price && (
                        <p className="text-red-600 text-xs mt-1">{fieldErrors.price}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Discount (₹)</label>
                      <input
                        type="number"
                        value={newPackage.discount}
                        onChange={(e) => setNewPackage({ ...newPackage, discount: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        placeholder="0.00"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Duration</label>
                      <input
                        type="text"
                        value={newPackage.duration}
                        onChange={(e) => setNewPackage({ ...newPackage, duration: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        placeholder="e.g., 3-5 days"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Package Image</label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handlePackageImageUpload}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      />
                    </div>
                  </div>

                  {newPackage.imagePreview && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Image Preview</label>
                      <div className="w-32 h-32 border border-gray-300 rounded-md overflow-hidden">
                        <img
                          src={newPackage.imagePreview}
                          alt="Preview"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Select Tests</label>
                    {fieldErrors.selectedTests && (
                      <p className="text-red-600 text-xs mb-2">{fieldErrors.selectedTests}</p>
                    )}
                    <div className="max-h-48 overflow-y-auto border border-gray-300 rounded-md p-3">
                      {tests.length === 0 ? (
                        <p className="text-gray-500 text-sm">No tests available. Please add tests first.</p>
                      ) : (
                        tests.map((test) => (
                          <label key={test._id} className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded">
                            <input
                              type="checkbox"
                              checked={newPackage.selectedTests.includes(test._id)}
                              onChange={() => toggleTestSelection(test._id)}
                              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                            />
                            <div className="flex-1">
                              <div className="text-sm font-medium text-gray-900">{test.name}</div>
                              <div className="text-xs text-gray-500">₹{test.price} • {test.category}</div>
                            </div>
                          </label>
                        ))
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Benefits</label>
                    <textarea
                      value={newPackage.benefits}
                      onChange={(e) => setNewPackage({ ...newPackage, benefits: e.target.value })}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      placeholder="e.g., Comprehensive health screening, Early detection of diseases"
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    onClick={() => setShowAddPackageModal(false)}
                    className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAddPackage}
                    disabled={loading}
                    className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                  >
                    {loading ? (
                      <>
                        <Loader className="h-4 w-4 mr-2 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      'Add Package'
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Edit Test Modal */}
        {showEditTestModal && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-10 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900">Edit Test</h3>
                  <button
                    onClick={() => setShowEditTestModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <span className="sr-only">Close</span>
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Test Name</label>
                    <input
                      type="text"
                      value={newTest.name}
                      onChange={(e) => {
                        setNewTest({ ...newTest, name: e.target.value })
                        if (fieldErrors.name) {
                          setFieldErrors(prev => ({ ...prev, name: '' }))
                        }
                      }}
                      className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${fieldErrors.name ? 'border-red-300 bg-red-50' : 'border-gray-300'
                        }`}
                    />
                    {fieldErrors.name && (
                      <p className="text-red-600 text-xs mt-1">{fieldErrors.name}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <textarea
                      value={newTest.description}
                      onChange={(e) => {
                        setNewTest({ ...newTest, description: e.target.value })
                        if (fieldErrors.description) {
                          setFieldErrors(prev => ({ ...prev, description: '' }))
                        }
                      }}
                      rows={3}
                      className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${fieldErrors.description ? 'border-red-300 bg-red-50' : 'border-gray-300'
                        }`}
                    />
                    {fieldErrors.description && (
                      <p className="text-red-600 text-xs mt-1">{fieldErrors.description}</p>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                      <select
                        value={newTest.category}
                        onChange={(e) => {
                          setNewTest({ ...newTest, category: e.target.value })
                          if (fieldErrors.category) {
                            setFieldErrors(prev => ({ ...prev, category: '' }))
                          }
                        }}
                        className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${fieldErrors.category ? 'border-red-300 bg-red-50' : 'border-gray-300'
                          }`}
                      >
                        <option value="">Select Category</option>
                        <option value="blood">Blood Tests</option>
                        <option value="urine">Urine Tests</option>
                        <option value="imaging">Imaging</option>
                        <option value="cardiology">Cardiology</option>
                        <option value="pathology">Pathology</option>
                      </select>
                      {fieldErrors.category && (
                        <p className="text-red-600 text-xs mt-1">{fieldErrors.category}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Price (₹)</label>
                      <input
                        type="number"
                        value={newTest.price}
                        onChange={(e) => {
                          setNewTest({ ...newTest, price: e.target.value })
                          if (fieldErrors.price) {
                            setFieldErrors(prev => ({ ...prev, price: '' }))
                          }
                        }}
                        className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${fieldErrors.price ? 'border-red-300 bg-red-50' : 'border-gray-300'
                          }`}
                        placeholder="0.00"
                      />
                      {fieldErrors.price && (
                        <p className="text-red-600 text-xs mt-1">{fieldErrors.price}</p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Duration</label>
                      <input
                        type="text"
                        value={newTest.duration}
                        onChange={(e) => {
                          setNewTest({ ...newTest, duration: e.target.value })
                          if (fieldErrors.duration) {
                            setFieldErrors(prev => ({ ...prev, duration: '' }))
                          }
                        }}
                        className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${fieldErrors.duration ? 'border-red-300 bg-red-50' : 'border-gray-300'
                          }`}
                        placeholder="e.g., 24-48 hours"
                      />
                      {fieldErrors.duration && (
                        <p className="text-red-600 text-xs mt-1">{fieldErrors.duration}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Test Image</label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      />
                    </div>
                  </div>

                  {newTest.imagePreview && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Image Preview</label>
                      <div className="w-32 h-32 border border-gray-300 rounded-md overflow-hidden">
                        <img
                          src={newTest.imagePreview}
                          alt="Preview"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </div>
                  )}

                  {/* Result Fields */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-sm font-medium text-gray-700">Result Fields</label>
                      <button
                        type="button"
                        onClick={addResultField}
                        className="text-sm px-2 py-1 bg-primary-600 text-white rounded hover:bg-primary-700"
                      >
                        Add Field
                      </button>
                    </div>
                    {(newTest.resultFields && newTest.resultFields.length > 0) ? (
                      <div className="space-y-3">
                        {newTest.resultFields.map((field, idx) => (
                          <div key={idx} className="grid grid-cols-12 gap-2 items-end">
                            <div className="col-span-3">
                              <label className="block text-xs font-medium text-gray-700 mb-1">Label</label>
                              <input
                                type="text"
                                value={field.label}
                                onChange={(e) => updateResultField(idx, 'label', e.target.value)}
                                className="w-full px-2 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                placeholder="e.g., Hemoglobin"
                              />
                            </div>
                            <div className="col-span-2">
                              <label className="block text-xs font-medium text-gray-700 mb-1">Unit</label>
                              <input
                                type="text"
                                value={field.unit}
                                onChange={(e) => updateResultField(idx, 'unit', e.target.value)}
                                className="w-full px-2 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                placeholder="g/dL"
                              />
                            </div>
                            <div className="col-span-4">
                              <label className="block text-xs font-medium text-gray-700 mb-1">Reference Range</label>
                              <input
                                type="text"
                                value={field.referenceRange}
                                onChange={(e) => updateResultField(idx, 'referenceRange', e.target.value)}
                                className="w-full px-2 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                placeholder="13.5 - 17.5"
                              />
                            </div>
                            <div className="col-span-2">
                              <label className="block text-xs font-medium text-gray-700 mb-1">Type</label>
                              <select
                                value={field.type || 'text'}
                                onChange={(e) => updateResultField(idx, 'type', e.target.value)}
                                className="w-full px-2 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                              >
                                <option value="text">Text</option>
                                <option value="number">Number</option>
                                <option value="boolean">Yes/No</option>
                              </select>
                            </div>
                            <div className="col-span-1 flex items-center">
                              <input
                                id={`edit-req-${idx}`}
                                type="checkbox"
                                checked={!!field.required}
                                onChange={(e) => updateResultField(idx, 'required', e.target.checked)}
                                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded mr-2"
                              />
                              <label htmlFor={`edit-req-${idx}`} className="text-xs text-gray-700">Req</label>
                            </div>
                            <div className="col-span-12 flex justify-end">
                              <button
                                type="button"
                                onClick={() => removeResultField(idx)}
                                className="text-red-600 text-xs hover:text-red-800"
                              >
                                Remove
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-gray-500">No fields added yet.</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Preparation Instructions</label>
                    <textarea
                      value={newTest.preparation}
                      onChange={(e) => setNewTest({ ...newTest, preparation: e.target.value })}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      placeholder="e.g., Fasting required for 12 hours"
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    onClick={() => setShowEditTestModal(false)}
                    className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleUpdateTest}
                    disabled={loading}
                    className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                  >
                    {loading ? (
                      <>
                        <Loader className="h-4 w-4 mr-2 animate-spin" />
                        Updating...
                      </>
                    ) : (
                      'Update Test'
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Edit Package Modal */}
        {showEditPackageModal && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-10 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900">Edit Package</h3>
                  <button
                    onClick={() => setShowEditPackageModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <span className="sr-only">Close</span>
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Package Name</label>
                    <input
                      type="text"
                      value={newPackage.name}
                      onChange={(e) => {
                        setNewPackage({ ...newPackage, name: e.target.value })
                        if (fieldErrors.name) {
                          setFieldErrors(prev => ({ ...prev, name: '' }))
                        }
                      }}
                      className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${fieldErrors.name ? 'border-red-300 bg-red-50' : 'border-gray-300'
                        }`}
                    />
                    {fieldErrors.name && (
                      <p className="text-red-600 text-xs mt-1">{fieldErrors.name}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <textarea
                      value={newPackage.description}
                      onChange={(e) => {
                        setNewPackage({ ...newPackage, description: e.target.value })
                        if (fieldErrors.description) {
                          setFieldErrors(prev => ({ ...prev, description: '' }))
                        }
                      }}
                      rows={3}
                      className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${fieldErrors.description ? 'border-red-300 bg-red-50' : 'border-gray-300'
                        }`}
                    />
                    {fieldErrors.description && (
                      <p className="text-red-600 text-xs mt-1">{fieldErrors.description}</p>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Package Price (₹)</label>
                      <input
                        type="number"
                        value={newPackage.price}
                        onChange={(e) => {
                          setNewPackage({ ...newPackage, price: e.target.value })
                          if (fieldErrors.price) {
                            setFieldErrors(prev => ({ ...prev, price: '' }))
                          }
                        }}
                        className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${fieldErrors.price ? 'border-red-300 bg-red-50' : 'border-gray-300'
                          }`}
                        placeholder="0.00"
                      />
                      {fieldErrors.price && (
                        <p className="text-red-600 text-xs mt-1">{fieldErrors.price}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Discount (₹)</label>
                      <input
                        type="number"
                        value={newPackage.discount}
                        onChange={(e) => setNewPackage({ ...newPackage, discount: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        placeholder="0.00"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Duration</label>
                      <input
                        type="text"
                        value={newPackage.duration}
                        onChange={(e) => setNewPackage({ ...newPackage, duration: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        placeholder="e.g., 3-5 days"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Package Image</label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handlePackageImageUpload}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      />
                    </div>
                  </div>

                  {newPackage.imagePreview && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Image Preview</label>
                      <div className="w-32 h-32 border border-gray-300 rounded-md overflow-hidden">
                        <img
                          src={newPackage.imagePreview}
                          alt="Preview"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Select Tests</label>
                    {fieldErrors.selectedTests && (
                      <p className="text-red-600 text-xs mb-2">{fieldErrors.selectedTests}</p>
                    )}
                    <div className="max-h-48 overflow-y-auto border border-gray-300 rounded-md p-3">
                      {tests.length === 0 ? (
                        <p className="text-gray-500 text-sm">No tests available. Please add tests first.</p>
                      ) : (
                        tests.map((test) => (
                          <label key={test._id} className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded">
                            <input
                              type="checkbox"
                              checked={newPackage.selectedTests.includes(test._id)}
                              onChange={() => toggleTestSelection(test._id)}
                              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                            />
                            <div className="flex-1">
                              <div className="text-sm font-medium text-gray-900">{test.name}</div>
                              <div className="text-xs text-gray-500">₹{test.price} • {test.category}</div>
                            </div>
                          </label>
                        ))
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Benefits</label>
                    <textarea
                      value={newPackage.benefits}
                      onChange={(e) => setNewPackage({ ...newPackage, benefits: e.target.value })}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      placeholder="e.g., Comprehensive health screening, Early detection of diseases"
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    onClick={() => setShowEditPackageModal(false)}
                    className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleUpdatePackage}
                    disabled={loading}
                    className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                  >
                    {loading ? (
                      <>
                        <Loader className="h-4 w-4 mr-2 animate-spin" />
                        Updating...
                      </>
                    ) : (
                      'Update Package'
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }


  const ManageUsers = () => {
    const [activeTab, setActiveTab] = useState('staff')
    const [showAddStaffModal, setShowAddStaffModal] = useState(false)
    const [showEditStaffModal, setShowEditStaffModal] = useState(false)
    const [selectedStaff, setSelectedStaff] = useState(null)
    const [searchTerm, setSearchTerm] = useState('')
    const [filterRole, setFilterRole] = useState('all')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [fieldErrors, setFieldErrors] = useState({})

    // Real data from MongoDB
    const [staffMembers, setStaffMembers] = useState([])
    const [users, setUsers] = useState([])
    const [labs, setLabs] = useState([])

    const [newStaff, setNewStaff] = useState({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      role: 'staff',
      department: '',
      assignedLab: '',
      password: '',
      confirmPassword: '',
      useRandomPassword: true
    })

    // Fetch data on component mount
    useEffect(() => {
      // Check if user is authenticated before making API calls
      const token = localStorage.getItem('token')
      if (token) {
        fetchStaffMembers()
        fetchUsers()
        fetchLabs()
      } else {
        setError('Please log in to access this page')
      }
    }, [])

    const fetchStaffMembers = async () => {
      try {
        setLoading(true)
        setError('')
        const response = await staffAPI.getStaff()
        setStaffMembers(response.data || [])
      } catch (err) {
        const errorMessage = err.message || 'Failed to fetch staff members'
        setError(errorMessage)
        console.error('Error fetching staff:', err)
        // If it's an authentication error, don't show it as a general error
        if (errorMessage.includes('401') || errorMessage.includes('unauthorized')) {
          setError('Authentication required. Please log in again.')
        }
      } finally {
        setLoading(false)
      }
    }

    const fetchUsers = async () => {
      try {
        const response = await staffAPI.getUsers()
        setUsers(response.data || [])
      } catch (err) {
        console.error('Error fetching users:', err)
        // Don't set error for users fetch as it's not critical
      }
    }

    const fetchLabs = async () => {
      try {
        const response = await labAPI.getLabs()
        setLabs(response.data || [])
      } catch (err) {
        console.error('Error fetching labs:', err)
        // Don't set error for labs fetch as it's not critical
      }
    }

    // Generate random password
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

    const handleAddStaff = async () => {
      try {
        setLoading(true)
        setError('')
        setFieldErrors({})

        // Validate required fields
        const errors = {}
        if (!newStaff.firstName) errors.firstName = 'First name is required'
        if (!newStaff.lastName) errors.lastName = 'Last name is required'
        if (!newStaff.email) errors.email = 'Email is required'
        if (!newStaff.phone) errors.phone = 'Phone number is required'

        // Validate lab assignment for local_admin role
        if (newStaff.role === 'local_admin' && !newStaff.assignedLab) {
          errors.assignedLab = 'Lab assignment is required for Local Admin role'
        }

        if (Object.keys(errors).length > 0) {
          setFieldErrors(errors)
          setLoading(false)
          return
        }

        // Validate password
        if (!newStaff.useRandomPassword) {
          if (!newStaff.password || !newStaff.confirmPassword) {
            setError('Password and confirm password are required')
            setLoading(false)
            return
          }
          if (newStaff.password !== newStaff.confirmPassword) {
            setError('Passwords do not match')
            setLoading(false)
            return
          }
          if (newStaff.password.length < 6) {
            setError('Password must be at least 6 characters long')
            setLoading(false)
            return
          }
        }

        // Create staff member
        const response = await staffAPI.createStaff(newStaff)

        // Refresh staff list
        await fetchStaffMembers()

        // Close modal and reset form
        setShowAddStaffModal(false)
        setNewStaff({
          firstName: '',
          lastName: '',
          email: '',
          phone: '',
          role: 'staff',
          department: '',
          assignedLab: '',
          password: '',
          confirmPassword: '',
          useRandomPassword: true
        })

        // Show success message
        await Swal.fire({
          icon: 'success',
          title: 'Success!',
          text: 'Staff member created successfully! Welcome email sent.',
          confirmButtonColor: '#2563eb',
          confirmButtonText: 'OK'
        })

      } catch (err) {
        let errorMessage = 'Failed to create staff member'

        if (err.message) {
          errorMessage = err.message

          // Handle specific validation errors
          if (err.message.includes('phone')) {
            errorMessage = 'Invalid phone number format. Please enter a valid phone number (e.g., 09496268372)'
          } else if (err.message.includes('email')) {
            errorMessage = 'Invalid email format. Please enter a valid email address'
          } else if (err.message.includes('duplicate')) {
            errorMessage = 'Email already exists. Please use a different email address'
          }
        }

        setError(errorMessage)
        console.error('Error creating staff:', err)
      } finally {
        setLoading(false)
      }
    }

    // Handle edit staff
    const handleEditStaff = (staff) => {
      // Check if it's admin user
      if (staff.email === 'admin@labmate.com') {
        Swal.fire({
          icon: 'warning',
          title: 'Access Denied',
          text: 'Admin user cannot be edited',
          confirmButtonColor: '#2563eb',
          confirmButtonText: 'OK'
        })
        return
      }

      setSelectedStaff(staff)
      setNewStaff({
        firstName: staff.firstName,
        lastName: staff.lastName,
        email: staff.email,
        phone: staff.phone,
        role: staff.role,
        department: staff.department || '',
        assignedLab: staff.assignedLab || '',
        password: '',
        confirmPassword: '',
        useRandomPassword: false
      })
      setFieldErrors({})
      setError('')
      setShowEditStaffModal(true)
    }

    const handleUpdateStaff = async () => {
      try {
        setLoading(true)
        setError('')
        setFieldErrors({})

        // Validate required fields
        const errors = {}
        if (!newStaff.firstName) errors.firstName = 'First name is required'
        if (!newStaff.lastName) errors.lastName = 'Last name is required'
        if (!newStaff.email) errors.email = 'Email is required'
        if (!newStaff.phone) errors.phone = 'Phone number is required'

        // Validate lab assignment for local_admin role
        if (newStaff.role === 'local_admin' && !newStaff.assignedLab) {
          errors.assignedLab = 'Lab assignment is required for Local Admin role'
        }

        if (Object.keys(errors).length > 0) {
          setFieldErrors(errors)
          setLoading(false)
          return
        }

        // Validate password if provided
        if (!newStaff.useRandomPassword && newStaff.password) {
          if (!newStaff.confirmPassword) {
            setError('Please confirm the password')
            setLoading(false)
            return
          }
          if (newStaff.password !== newStaff.confirmPassword) {
            setError('Passwords do not match')
            setLoading(false)
            return
          }
          if (newStaff.password.length < 6) {
            setError('Password must be at least 6 characters long')
            setLoading(false)
            return
          }
        }

        // Prepare update data
        const updateData = {
          firstName: newStaff.firstName,
          lastName: newStaff.lastName,
          email: newStaff.email,
          phone: newStaff.phone,
          role: newStaff.role,
          department: newStaff.department,
          assignedLab: newStaff.assignedLab,
          ...(newStaff.password && { password: newStaff.password })
        }

        // Update staff member
        const response = await staffAPI.updateStaff(selectedStaff._id, updateData)

        // Refresh staff list
        await fetchStaffMembers()

        // Close modal and reset form
        setShowEditStaffModal(false)
        setSelectedStaff(null)
        setNewStaff({
          firstName: '',
          lastName: '',
          email: '',
          phone: '',
          role: 'staff',
          department: '',
          assignedLab: '',
          password: '',
          confirmPassword: '',
          useRandomPassword: true
        })

        // Show success message
        await Swal.fire({
          icon: 'success',
          title: 'Success!',
          text: 'Staff member updated successfully!',
          confirmButtonColor: '#2563eb',
          confirmButtonText: 'OK'
        })

      } catch (err) {
        let errorMessage = 'Failed to update staff member'

        if (err.message) {
          errorMessage = err.message

          // Handle specific validation errors
          if (err.message.includes('phone')) {
            errorMessage = 'Invalid phone number format. Please enter a valid phone number (e.g., 09496268372)'
          } else if (err.message.includes('email')) {
            errorMessage = 'Invalid email format. Please enter a valid email address'
          } else if (err.message.includes('duplicate')) {
            errorMessage = 'Email already exists. Please use a different email address'
          }
        }

        setError(errorMessage)
        console.error('Error updating staff:', err)
      } finally {
        setLoading(false)
      }
    }

    // Handle block/unblock user
    const handleToggleUserBlock = async (user, isBlocked) => {
      try {
        const action = isBlocked ? 'unblock' : 'block'
        const actionText = isBlocked ? 'unblock' : 'block'

        // Show confirmation dialog
        const result = await Swal.fire({
          title: `${actionText.charAt(0).toUpperCase() + actionText.slice(1)} User?`,
          text: `Are you sure you want to ${actionText} ${user.firstName} ${user.lastName}?`,
          icon: 'warning',
          showCancelButton: true,
          confirmButtonColor: isBlocked ? '#2563eb' : '#dc2626',
          cancelButtonColor: '#6b7280',
          confirmButtonText: `Yes, ${actionText} user!`,
          cancelButtonText: 'Cancel',
          reverseButtons: true
        })

        if (result.isConfirmed) {
          // Update user block status
          await staffAPI.updateUserBlockStatus(user._id, { isBlocked: !isBlocked })

          // Refresh users list
          await fetchUsers()

          // Show success message
          await Swal.fire({
            icon: 'success',
            title: 'Success!',
            text: `User has been ${actionText}ed successfully!`,
            confirmButtonColor: '#2563eb',
            confirmButtonText: 'OK'
          })
        }
      } catch (err) {
        Swal.fire({
          icon: 'error',
          title: 'Error!',
          text: err.message || `Failed to ${isBlocked ? 'unblock' : 'block'} user`,
          confirmButtonColor: '#dc2626',
          confirmButtonText: 'OK'
        })
        console.error(`Error ${isBlocked ? 'unblocking' : 'blocking'} user:`, err)
      }
    }

    // Handle delete staff
    const handleDeleteStaff = async (staff) => {
      // Check if it's admin user
      if (staff.email === 'admin@labmate.com') {
        Swal.fire({
          icon: 'warning',
          title: 'Access Denied',
          text: 'Admin user cannot be deleted',
          confirmButtonColor: '#2563eb',
          confirmButtonText: 'OK'
        })
        return
      }

      // Show confirmation dialog
      const result = await Swal.fire({
        title: 'Delete Staff Member?',
        text: `Are you sure you want to delete ${staff.firstName} ${staff.lastName}? This action cannot be undone.`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#dc2626',
        cancelButtonColor: '#6b7280',
        confirmButtonText: 'Yes, delete it!',
        cancelButtonText: 'Cancel',
        reverseButtons: true
      })

      if (result.isConfirmed) {
        await confirmDeleteStaff(staff)
      }
    }

    const confirmDeleteStaff = async (staff) => {
      try {
        // Delete staff member
        await staffAPI.deleteStaff(staff._id)

        // Refresh staff list
        await fetchStaffMembers()

        // Show success message
        await Swal.fire({
          icon: 'success',
          title: 'Deleted!',
          text: 'Staff member deleted successfully!',
          confirmButtonColor: '#2563eb',
          confirmButtonText: 'OK'
        })

      } catch (err) {
        Swal.fire({
          icon: 'error',
          title: 'Error!',
          text: err.message || 'Failed to delete staff member',
          confirmButtonColor: '#dc2626',
          confirmButtonText: 'OK'
        })
        console.error('Error deleting staff:', err)
      }
    }

    const filteredStaff = staffMembers.filter(staff => {
      const matchesSearch = `${staff.firstName} ${staff.lastName} ${staff.email}`.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesRole = filterRole === 'all' || staff.role === filterRole
      return matchesSearch && matchesRole
    })

    const filteredUsers = users.filter(user => {
      return `${user.firstName} ${user.lastName} ${user.email}`.toLowerCase().includes(searchTerm.toLowerCase())
    })

    return (
      <div className="p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Manage Users & Staff</h1>
          <p className="text-gray-600">Administrate user accounts, roles, and permissions</p>
        </div>

        {/* Tab Navigation */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('staff')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${activeTab === 'staff'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
              >
                <UserCheck className="h-4 w-4 inline mr-2" />
                Staff Management ({staffMembers.length})
              </button>
              <button
                onClick={() => setActiveTab('users')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${activeTab === 'users'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
              >
                <Users className="h-4 w-4 inline mr-2" />
                Patient Management ({users.length})
              </button>
            </nav>
          </div>
        </div>

        {/* Staff Management Tab */}
        {activeTab === 'staff' && (
          <div>
            {/* Staff Actions Bar */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="relative">
                    <Search className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search staff members..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 w-full sm:w-64"
                    />
                  </div>
                  <select
                    value={filterRole}
                    onChange={(e) => setFilterRole(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="all">All Roles</option>
                    <option value="local_admin">Local Admin</option>
                    <option value="lab_technician">Lab Technician</option>
                    <option value="xray_technician">X-Ray Technician</option>
                    <option value="staff">Staff</option>
                  </select>
                </div>
                <div className="flex gap-3">
                  <button className="flex items-center px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                    <Download className="h-4 w-4 mr-2" />
                    Export
                  </button>
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
                        assignedLab: '',
                        password: randomPassword,
                        confirmPassword: randomPassword,
                        useRandomPassword: true
                      })
                      setFieldErrors({})
                      setError('')
                      setShowAddStaffModal(true)
                    }}
                    className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Staff
                  </button>
                </div>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 flex items-center">
                <AlertCircle className="h-5 w-5 mr-2" />
                {error}
              </div>
            )}

            {/* Staff Table */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Staff Member
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Contact
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Role & Department
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Assigned Lab
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Join Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {loading ? (
                      <tr>
                        <td colSpan="7" className="px-6 py-12 text-center">
                          <div className="flex items-center justify-center">
                            <Loader className="h-6 w-6 animate-spin mr-3" />
                            Loading staff members...
                          </div>
                        </td>
                      </tr>
                    ) : filteredStaff.length === 0 ? (
                      <tr>
                        <td colSpan="7" className="px-6 py-12 text-center text-gray-500">
                          No staff members found
                        </td>
                      </tr>
                    ) : (
                      filteredStaff.map((staff) => (
                        <tr key={staff._id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
                                <span className="text-sm font-medium text-primary-600">
                                  {staff.firstName[0]}{staff.lastName[0]}
                                </span>
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900">
                                  {staff.firstName} {staff.lastName}
                                </div>
                                <div className="text-sm text-gray-500">
                                  ID: #{staff._id.slice(-6)}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900 flex items-center">
                              <Mail className="h-4 w-4 mr-2 text-gray-400" />
                              {staff.email}
                            </div>
                            <div className="text-sm text-gray-500 flex items-center mt-1">
                              <Phone className="h-4 w-4 mr-2 text-gray-400" />
                              {staff.phone}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900 capitalize">
                              {staff.role.replace('_', ' ')}
                            </div>
                            <div className="text-sm text-gray-500">
                              {staff.department || 'Not specified'}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {staff.assignedLab ? (
                                (() => {
                                  const assignedLab = labs.find(lab => lab._id === staff.assignedLab);
                                  return assignedLab ? assignedLab.name : 'Lab not found';
                                })()
                              ) : (
                                <span className="text-gray-400">Not assigned</span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${staff.isActive
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                              }`}>
                              {staff.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {staff.joinDate ? new Date(staff.joinDate).toLocaleDateString() : 'N/A'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex space-x-2">
                              <button
                                onClick={() => handleEditStaff(staff)}
                                className={`text-primary-600 hover:text-primary-900 ${staff.email === 'admin@labmate.com' ? 'opacity-50 cursor-not-allowed' : ''
                                  }`}
                                disabled={staff.email === 'admin@labmate.com'}
                                title={staff.email === 'admin@labmate.com' ? 'Admin user cannot be edited' : 'Edit staff member'}
                              >
                                <Edit className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteStaff(staff)}
                                className={`text-red-600 hover:text-red-900 ${staff.email === 'admin@labmate.com' ? 'opacity-50 cursor-not-allowed' : ''
                                  }`}
                                disabled={staff.email === 'admin@labmate.com'}
                                title={staff.email === 'admin@labmate.com' ? 'Admin user cannot be deleted' : 'Delete staff member'}
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Patient Management Tab */}
        {activeTab === 'users' && (
          <div>
            {/* User Actions Bar */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="relative">
                  <Search className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search patients..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 w-full sm:w-64"
                  />
                </div>
                <div className="flex gap-3">
                  <button className="flex items-center px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                    <Download className="h-4 w-4 mr-2" />
                    Export
                  </button>
                  <button className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors">
                    <Upload className="h-4 w-4 mr-2" />
                    Import
                  </button>
                </div>
              </div>
            </div>

            {/* Users Table */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Patient
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Contact
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Registration
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Activity
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Block Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {loading ? (
                      <tr>
                        <td colSpan="7" className="px-6 py-12 text-center">
                          <div className="flex items-center justify-center">
                            <Loader className="h-6 w-6 animate-spin mr-3" />
                            Loading users...
                          </div>
                        </td>
                      </tr>
                    ) : filteredUsers.length === 0 ? (
                      <tr>
                        <td colSpan="7" className="px-6 py-12 text-center text-gray-500">
                          No users found
                        </td>
                      </tr>
                    ) : (
                      filteredUsers.map((user) => (
                        <tr key={user._id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                                <span className="text-sm font-medium text-blue-600">
                                  {user.firstName[0]}{user.lastName[0]}
                                </span>
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900">
                                  {user.firstName} {user.lastName}
                                </div>
                                <div className="text-sm text-gray-500">
                                  ID: #{user._id.slice(-6)}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900 flex items-center">
                              <Mail className="h-4 w-4 mr-2 text-gray-400" />
                              {user.email}
                            </div>
                            <div className="text-sm text-gray-500 flex items-center mt-1">
                              <Phone className="h-4 w-4 mr-2 text-gray-400" />
                              {user.phone}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${user.isEmailVerified
                              ? 'bg-green-100 text-green-800'
                              : 'bg-yellow-100 text-yellow-800'
                              }`}>
                              {user.isEmailVerified ? 'Verified' : 'Pending'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'Never'}
                            </div>
                            <div className="text-sm text-gray-500">
                              Last login
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${user.isBlocked
                              ? 'bg-red-100 text-red-800'
                              : 'bg-green-100 text-green-800'
                              }`}>
                              {user.isBlocked ? 'Blocked' : 'Active'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex space-x-2">
                              <button
                                onClick={() => handleToggleUserBlock(user, user.isBlocked)}
                                className={`${user.isBlocked
                                  ? 'text-green-600 hover:text-green-900'
                                  : 'text-red-600 hover:text-red-900'
                                  }`}
                                title={user.isBlocked ? 'Unblock user' : 'Block user'}
                              >
                                {user.isBlocked ? (
                                  <UserCheck className="h-4 w-4" />
                                ) : (
                                  <AlertCircle className="h-4 w-4" />
                                )}
                              </button>
                              <button className="text-primary-600 hover:text-primary-900">
                                <Edit className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Add Staff Modal */}
        {showAddStaffModal && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-full max-w-md shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900">Add New Staff Member</h3>
                  <button
                    onClick={() => setShowAddStaffModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <span className="sr-only">Close</span>
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                      <input
                        type="text"
                        value={newStaff.firstName}
                        onChange={(e) => {
                          setNewStaff({ ...newStaff, firstName: e.target.value })
                          if (fieldErrors.firstName) {
                            setFieldErrors(prev => ({ ...prev, firstName: '' }))
                          }
                        }}
                        className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${fieldErrors.firstName ? 'border-red-300 bg-red-50' : 'border-gray-300'
                          }`}
                      />
                      {fieldErrors.firstName && (
                        <p className="text-red-600 text-xs mt-1">{fieldErrors.firstName}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                      <input
                        type="text"
                        value={newStaff.lastName}
                        onChange={(e) => {
                          setNewStaff({ ...newStaff, lastName: e.target.value })
                          if (fieldErrors.lastName) {
                            setFieldErrors(prev => ({ ...prev, lastName: '' }))
                          }
                        }}
                        className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${fieldErrors.lastName ? 'border-red-300 bg-red-50' : 'border-gray-300'
                          }`}
                      />
                      {fieldErrors.lastName && (
                        <p className="text-red-600 text-xs mt-1">{fieldErrors.lastName}</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <input
                      type="email"
                      value={newStaff.email}
                      onChange={(e) => {
                        setNewStaff({ ...newStaff, email: e.target.value })
                        if (fieldErrors.email) {
                          setFieldErrors(prev => ({ ...prev, email: '' }))
                        }
                      }}
                      className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${fieldErrors.email ? 'border-red-300 bg-red-50' : 'border-gray-300'
                        }`}
                    />
                    {fieldErrors.email && (
                      <p className="text-red-600 text-xs mt-1">{fieldErrors.email}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                    <input
                      type="tel"
                      value={newStaff.phone}
                      onChange={(e) => {
                        setNewStaff({ ...newStaff, phone: e.target.value })
                        if (fieldErrors.phone) {
                          setFieldErrors(prev => ({ ...prev, phone: '' }))
                        }
                      }}
                      className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${fieldErrors.phone ? 'border-red-300 bg-red-50' : 'border-gray-300'
                        }`}
                      placeholder="e.g., 09496268372"
                    />
                    {fieldErrors.phone && (
                      <p className="text-red-600 text-xs mt-1">{fieldErrors.phone}</p>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                      <select
                        value={newStaff.role}
                        onChange={(e) => setNewStaff({ ...newStaff, role: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      >
                        <option value="staff">Staff</option>
                        <option value="lab_technician">Lab Technician</option>
                        <option value="xray_technician">X-Ray Technician</option>
                        <option value="local_admin">Local Admin</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                      <input
                        type="text"
                        value={newStaff.department}
                        onChange={(e) => setNewStaff({ ...newStaff, department: e.target.value })}
                        placeholder="e.g., Pathology"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      />
                    </div>
                  </div>

                  {/* Lab Assignment */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Assigned Lab</label>
                    <select
                      value={newStaff.assignedLab}
                      onChange={(e) => {
                        setNewStaff({ ...newStaff, assignedLab: e.target.value })
                        if (fieldErrors.assignedLab) {
                          setFieldErrors(prev => ({ ...prev, assignedLab: '' }))
                        }
                      }}
                      className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${fieldErrors.assignedLab ? 'border-red-300 bg-red-50' : 'border-gray-300'
                        }`}
                    >
                      <option value="">Select Lab (Optional)</option>
                      {labs.filter(lab => lab.isActive).map(lab => (
                        <option key={lab._id} value={lab._id}>
                          {lab.name}
                        </option>
                      ))}
                    </select>
                    {fieldErrors.assignedLab && (
                      <p className="text-red-600 text-xs mt-1">{fieldErrors.assignedLab}</p>
                    )}
                    <p className="text-xs text-gray-500 mt-1">
                      Lab assignment is required for Local Admin role
                    </p>
                  </div>

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
                </div>

                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    onClick={() => setShowAddStaffModal(false)}
                    className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAddStaff}
                    disabled={loading}
                    className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                  >
                    {loading ? (
                      <>
                        <Loader className="h-4 w-4 mr-2 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      'Add Staff'
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Edit Staff Modal */}
        {showEditStaffModal && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-full max-w-md shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900">Edit Staff Member</h3>
                  <button
                    onClick={() => setShowEditStaffModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <span className="sr-only">Close</span>
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                      <input
                        type="text"
                        value={newStaff.firstName}
                        onChange={(e) => {
                          setNewStaff({ ...newStaff, firstName: e.target.value })
                          if (fieldErrors.firstName) {
                            setFieldErrors(prev => ({ ...prev, firstName: '' }))
                          }
                        }}
                        className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${fieldErrors.firstName ? 'border-red-300 bg-red-50' : 'border-gray-300'
                          }`}
                      />
                      {fieldErrors.firstName && (
                        <p className="text-red-600 text-xs mt-1">{fieldErrors.firstName}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                      <input
                        type="text"
                        value={newStaff.lastName}
                        onChange={(e) => {
                          setNewStaff({ ...newStaff, lastName: e.target.value })
                          if (fieldErrors.lastName) {
                            setFieldErrors(prev => ({ ...prev, lastName: '' }))
                          }
                        }}
                        className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${fieldErrors.lastName ? 'border-red-300 bg-red-50' : 'border-gray-300'
                          }`}
                      />
                      {fieldErrors.lastName && (
                        <p className="text-red-600 text-xs mt-1">{fieldErrors.lastName}</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <input
                      type="email"
                      value={newStaff.email}
                      onChange={(e) => {
                        setNewStaff({ ...newStaff, email: e.target.value })
                        if (fieldErrors.email) {
                          setFieldErrors(prev => ({ ...prev, email: '' }))
                        }
                      }}
                      className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${fieldErrors.email ? 'border-red-300 bg-red-50' : 'border-gray-300'
                        }`}
                    />
                    {fieldErrors.email && (
                      <p className="text-red-600 text-xs mt-1">{fieldErrors.email}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                    <input
                      type="tel"
                      value={newStaff.phone}
                      onChange={(e) => {
                        setNewStaff({ ...newStaff, phone: e.target.value })
                        if (fieldErrors.phone) {
                          setFieldErrors(prev => ({ ...prev, phone: '' }))
                        }
                      }}
                      className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${fieldErrors.phone ? 'border-red-300 bg-red-50' : 'border-gray-300'
                        }`}
                      placeholder="e.g., 09496268372"
                    />
                    {fieldErrors.phone && (
                      <p className="text-red-600 text-xs mt-1">{fieldErrors.phone}</p>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                      <select
                        value={newStaff.role}
                        onChange={(e) => setNewStaff({ ...newStaff, role: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      >
                        <option value="staff">Staff</option>
                        <option value="lab_technician">Lab Technician</option>
                        <option value="xray_technician">X-Ray Technician</option>
                        <option value="local_admin">Local Admin</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                      <input
                        type="text"
                        value={newStaff.department}
                        onChange={(e) => setNewStaff({ ...newStaff, department: e.target.value })}
                        placeholder="e.g., Pathology"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      />
                    </div>
                  </div>

                  {/* Lab Assignment */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Assigned Lab</label>
                    <select
                      value={newStaff.assignedLab}
                      onChange={(e) => {
                        setNewStaff({ ...newStaff, assignedLab: e.target.value })
                        if (fieldErrors.assignedLab) {
                          setFieldErrors(prev => ({ ...prev, assignedLab: '' }))
                        }
                      }}
                      className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${fieldErrors.assignedLab ? 'border-red-300 bg-red-50' : 'border-gray-300'
                        }`}
                    >
                      <option value="">Select Lab (Optional)</option>
                      {labs.filter(lab => lab.isActive).map(lab => (
                        <option key={lab._id} value={lab._id}>
                          {lab.name}
                        </option>
                      ))}
                    </select>
                    {fieldErrors.assignedLab && (
                      <p className="text-red-600 text-xs mt-1">{fieldErrors.assignedLab}</p>
                    )}
                    <p className="text-xs text-gray-500 mt-1">
                      Lab assignment is required for Local Admin role
                    </p>
                  </div>

                  {/* Password Update Section */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Update Password (Optional)</label>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                        <input
                          type="password"
                          value={newStaff.password}
                          onChange={(e) => setNewStaff({ ...newStaff, password: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                          placeholder="Leave empty to keep current password"
                        />
                      </div>
                      {newStaff.password && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
                          <input
                            type="password"
                            value={newStaff.confirmPassword}
                            onChange={(e) => setNewStaff({ ...newStaff, confirmPassword: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                            placeholder="Confirm new password"
                          />
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Leave password fields empty to keep the current password</p>
                  </div>
                </div>

                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    onClick={() => setShowEditStaffModal(false)}
                    className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleUpdateStaff}
                    disabled={loading}
                    className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                  >
                    {loading ? (
                      <>
                        <Loader className="h-4 w-4 mr-2 animate-spin" />
                        Updating...
                      </>
                    ) : (
                      'Update Staff'
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    )
  }



  const SettingsPage = () => (
    <PlaceholderPage
      title="System Settings"
      description="Configure global system settings and preferences"
      icon={SettingsIcon}
      features={[
        {
          title: "System Configuration",
          description: "Configure global system parameters and preferences"
        },
        {
          title: "Security Settings",
          description: "Manage security policies, authentication, and access controls"
        },
        {
          title: "Integration Settings",
          description: "Configure third-party integrations and API connections"
        }
      ]}
    />
  )

  return (
    <DashboardLayout
      title="Admin Dashboard"
      sidebarItems={sidebarItems}
      userRole="Administrator"
      userEmail="admin@labmate360.com"
    >
      <Routes>
        <Route path="/" element={<AdminOverview />} />
        <Route path="/tests" element={<ManageTests />} />
        <Route path="/labs" element={<ManageLabs />} />
        <Route path="/users" element={<ManageUsers />} />
        <Route path="/bookings" element={<AdminBookings />} />
        <Route path="/reports" element={<AdminReports />} />
        <Route path="/settings" element={<AdminSettings />} />
        <Route path="*" element={<Navigate to="/admin/dashboard" replace />} />
      </Routes>
    </DashboardLayout>
  )
}

export default AdminDashboard

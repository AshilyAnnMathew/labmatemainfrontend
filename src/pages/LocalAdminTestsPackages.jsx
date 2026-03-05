import React, { useState, useEffect } from 'react'
import { TestTube, Package, Search, Filter } from 'lucide-react'
import Swal from 'sweetalert2'
import api from '../services/api'

const LocalAdminTestsPackages = ({ assignedLab }) => {
  const [tests, setTests] = useState([])
  const [packages, setPackages] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('tests')
  const [searchTerm, setSearchTerm] = useState('')


  // Available tests/packages selection modal states
  const [showSelectTestsModal, setShowSelectTestsModal] = useState(false)
  const [showSelectPackagesModal, setShowSelectPackagesModal] = useState(false)
  const [availableTests, setAvailableTests] = useState([])
  const [availablePackages, setAvailablePackages] = useState([])
  const [selectedTestIds, setSelectedTestIds] = useState([])
  const [selectedPackageIds, setSelectedPackageIds] = useState([])


  // Fetch tests and packages for the assigned lab
  useEffect(() => {
    if (assignedLab && assignedLab._id) {
      fetchTests()
      fetchPackages()
    }
  }, [assignedLab])

  const fetchTests = async () => {
    try {
      const response = await api.localAdminAPI.getLabTests(assignedLab._id)
      if (response.success) {
        setTests(response.data)
      }
    } catch (error) {
      console.error('Error fetching tests:', error)
    }
  }

  const fetchPackages = async () => {
    try {
      const response = await api.localAdminAPI.getLabPackages(assignedLab._id)
      if (response.success) {
        setPackages(response.data)
      }
    } catch (error) {
      console.error('Error fetching packages:', error)
    } finally {
      setLoading(false)
    }
  }


  // Handle opening select tests modal
  const handleSelectTests = async () => {
    try {
      const response = await api.localAdminAPI.getAvailableTests(assignedLab._id)
      if (response.success) {
        setAvailableTests(response.data)
        // Pre-select tests that are already assigned to this lab
        const assignedTestIds = response.data
          .filter(test => test.isAssignedToLab)
          .map(test => test._id)
        setSelectedTestIds(assignedTestIds)
        setShowSelectTestsModal(true)
      }
    } catch (error) {
      console.error('Error fetching available tests:', error)
      Swal.fire({ icon: 'error', title: 'Failed to Load Tests', text: error.message, confirmButtonColor: '#ef4444' });
    }
  }

  // Handle opening select packages modal
  const handleSelectPackages = async () => {
    try {
      const response = await api.localAdminAPI.getAvailablePackages(assignedLab._id)
      if (response.success) {
        setAvailablePackages(response.data)
        // Pre-select packages that are already assigned to this lab
        const assignedPackageIds = response.data
          .filter(pkg => pkg.isAssignedToLab)
          .map(pkg => pkg._id)
        setSelectedPackageIds(assignedPackageIds)
        setShowSelectPackagesModal(true)
      }
    } catch (error) {
      console.error('Error fetching available packages:', error)
      Swal.fire({ icon: 'error', title: 'Failed to Load Packages', text: error.message, confirmButtonColor: '#ef4444' });
    }
  }

  // Handle saving test assignments
  const handleSaveTestAssignments = async () => {
    try {
      const response = await api.localAdminAPI.assignTestsToLab(assignedLab._id, selectedTestIds)
      if (response.success) {
        setShowSelectTestsModal(false)
        fetchTests()
        Swal.mixin({ toast: true, position: 'top-end', showConfirmButton: false, timer: 3000, timerProgressBar: true })
          .fire({ icon: 'success', title: 'Test assignments updated!' });
      }
    } catch (error) {
      console.error('Error updating test assignments:', error)
      Swal.fire({ icon: 'error', title: 'Update Failed', text: error.message, confirmButtonColor: '#ef4444' });
    }
  }

  // Handle saving package assignments
  const handleSavePackageAssignments = async () => {
    try {
      const response = await api.localAdminAPI.assignPackagesToLab(assignedLab._id, selectedPackageIds)
      if (response.success) {
        setShowSelectPackagesModal(false)
        fetchPackages()
        Swal.mixin({ toast: true, position: 'top-end', showConfirmButton: false, timer: 3000, timerProgressBar: true })
          .fire({ icon: 'success', title: 'Package assignments updated!' });
      }
    } catch (error) {
      console.error('Error updating package assignments:', error)
      Swal.fire({ icon: 'error', title: 'Update Failed', text: error.message, confirmButtonColor: '#ef4444' });
    }
  }

  // Handle test selection toggle
  const toggleTestSelection = (testId) => {
    setSelectedTestIds(prev =>
      prev.includes(testId)
        ? prev.filter(id => id !== testId)
        : [...prev, testId]
    )
  }

  // Handle package selection toggle
  const togglePackageSelection = (packageId) => {
    setSelectedPackageIds(prev =>
      prev.includes(packageId)
        ? prev.filter(id => id !== packageId)
        : [...prev, packageId]
    )
  }

  // Filter based on search term
  const filteredTests = tests.filter(test =>
    test.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    test.category.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const filteredPackages = packages.filter(pkg =>
    pkg.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    pkg.description.toLowerCase().includes(searchTerm.toLowerCase())
  )

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
          <h2 className="text-2xl font-bold text-gray-900">Tests & Packages Management</h2>
          <p className="text-gray-600">Manage tests and packages for {assignedLab?.name}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('tests')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${activeTab === 'tests'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
          >
            <TestTube className="h-5 w-5 inline mr-2" />
            Tests ({tests.length})
          </button>
          <button
            onClick={() => setActiveTab('packages')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${activeTab === 'packages'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
          >
            <Package className="h-5 w-5 inline mr-2" />
            Packages ({packages.length})
          </button>
        </nav>
      </div>

      {/* Search */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <div className="flex items-center space-x-2">
          <Search className="h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder={`Search ${activeTab}...`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2 flex-1 focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
      </div>

      {/* Tests Tab */}
      {activeTab === 'tests' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button
              onClick={handleSelectTests}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center"
            >
              <Filter className="h-5 w-5 mr-2" />
              Select Tests
            </button>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            {filteredTests.length === 0 ? (
              <div className="text-center py-12">
                <TestTube className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No tests found</h3>
                <p className="text-gray-600">
                  {searchTerm ? 'No tests match your search criteria.' : 'No tests available for this lab.'}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Test Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Category
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Price
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Duration
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredTests.map((test) => (
                      <tr key={test._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{test.name}</div>
                            <div className="text-sm text-gray-500">{test.description}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {test.category}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          ₹{test.price}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {test.duration} hours
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <span className="text-gray-500">Assigned to Lab</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Packages Tab */}
      {activeTab === 'packages' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button
              onClick={handleSelectPackages}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center"
            >
              <Filter className="h-5 w-5 mr-2" />
              Select Packages
            </button>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            {filteredPackages.length === 0 ? (
              <div className="text-center py-12">
                <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No packages found</h3>
                <p className="text-gray-600">
                  {searchTerm ? 'No packages match your search criteria.' : 'No packages available for this lab.'}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Package Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Tests Included
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Price
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Duration
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredPackages.map((pkg) => (
                      <tr key={pkg._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{pkg.name}</div>
                            <div className="text-sm text-gray-500">{pkg.description}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900">
                            {pkg.selectedTests ? `${pkg.selectedTests.length} tests` : '0 tests'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          ₹{pkg.price}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {pkg.duration} hours
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <span className="text-gray-500">Assigned to Lab</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}


      {/* Select Tests Modal */}
      {showSelectTestsModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Select Tests for Your Lab
            </h3>
            <div className="space-y-4 mb-6">
              {availableTests.map((test) => (
                <div
                  key={test._id}
                  className={`p-4 border rounded-lg cursor-pointer transition-colors ${selectedTestIds.includes(test._id)
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-gray-200 hover:border-gray-300'
                    }`}
                  onClick={() => toggleTestSelection(test._id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        checked={selectedTestIds.includes(test._id)}
                        onChange={() => toggleTestSelection(test._id)}
                        className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded mr-3"
                      />
                      <div>
                        <h4 className="text-sm font-medium text-gray-900">{test.name}</h4>
                        <p className="text-sm text-gray-500">{test.description}</p>
                        <div className="flex items-center space-x-4 mt-2">
                          <span className="text-xs text-gray-500">Category: {test.category}</span>
                          <span className="text-xs text-gray-500">Price: ₹{test.price}</span>
                          <span className="text-xs text-gray-500">Duration: {test.duration}</span>
                        </div>
                      </div>
                    </div>
                    {test.isAssignedToLab && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Currently Assigned
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setShowSelectTestsModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveTestAssignments}
                className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
              >
                Save Assignments
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Select Packages Modal */}
      {showSelectPackagesModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Select Packages for Your Lab
            </h3>
            <div className="space-y-4 mb-6">
              {availablePackages.map((pkg) => (
                <div
                  key={pkg._id}
                  className={`p-4 border rounded-lg cursor-pointer transition-colors ${selectedPackageIds.includes(pkg._id)
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-gray-200 hover:border-gray-300'
                    }`}
                  onClick={() => togglePackageSelection(pkg._id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        checked={selectedPackageIds.includes(pkg._id)}
                        onChange={() => togglePackageSelection(pkg._id)}
                        className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded mr-3"
                      />
                      <div>
                        <h4 className="text-sm font-medium text-gray-900">{pkg.name}</h4>
                        <p className="text-sm text-gray-500">{pkg.description}</p>
                        <div className="flex items-center space-x-4 mt-2">
                          <span className="text-xs text-gray-500">Price: ₹{pkg.price}</span>
                          <span className="text-xs text-gray-500">Duration: {pkg.duration}</span>
                          <span className="text-xs text-gray-500">
                            Tests: {pkg.selectedTests ? pkg.selectedTests.length : 0}
                          </span>
                        </div>
                      </div>
                    </div>
                    {pkg.isAssignedToLab && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Currently Assigned
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setShowSelectPackagesModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSavePackageAssignments}
                className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
              >
                Save Assignments
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default LocalAdminTestsPackages
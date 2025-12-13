import React, { useState } from 'react';
import { Plus, Search, Filter, Download, Edit, Eye, IndianRupee, Percent } from 'lucide-react';
import Table from '../Common/Table';
import StatusBadge from '../Common/StatusBadge';
import Modal from '../Common/Modal';

const PricingList = () => {
  const [pricingData, setPricingData] = useState([
    {
      id: '1',
      name: 'General Customer Pricing',
      type: 'fixed',
      value: 0,
      description: 'Standard pricing for general customers',
      status: 'active',
      applicableTo: ['general'],
      createdAt: '2024-01-15'
    },
    {
      id: '2',
      name: 'Architect Discount',
      type: 'percentage',
      value: 15,
      description: '15% discount for architects',
      status: 'active',
      applicableTo: ['architect'],
      createdAt: '2024-01-15'
    },
    {
      id: '3',
      name: 'Dealer Discount',
      type: 'percentage',
      value: 25,
      description: '25% discount for dealers',
      status: 'active',
      applicableTo: ['dealer'],
      createdAt: '2024-01-15'
    },
    {
      id: '4',
      name: 'Bulk Order Discount',
      type: 'percentage',
      value: 10,
      description: '10% discount for orders above ₹1,00,000',
      status: 'active',
      applicableTo: ['general', 'architect', 'dealer'],
      createdAt: '2024-01-16'
    }
  ]);

  const [selectedPricing, setSelectedPricing] = useState(null);
  const [showAddPricing, setShowAddPricing] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    type: '',
    status: '',
    applicableTo: ''
  });

  const [newPricing, setNewPricing] = useState({
    name: '',
    type: 'percentage',
    value: '',
    description: '',
    status: 'active',
    applicableTo: []
  });

  const handleAddPricing = () => {
    const pricing = {
      ...newPricing,
      id: String(pricingData.length + 1),
      value: Number(newPricing.value),
      createdAt: new Date().toISOString().split('T')[0]
    };
    setPricingData([...pricingData, pricing]);
    setShowAddPricing(false);
    setNewPricing({
      name: '',
      type: 'percentage',
      value: '',
      description: '',
      status: 'active',
      applicableTo: []
    });
  };

  const columns = [
    {
      key: 'name',
      header: 'Pricing Rule',
      sortable: true,
      render: (value, item) => (
        <div>
          <div className="font-medium text-gray-900 font-roboto">{value}</div>
          <div className="text-sm text-gray-500">{item.description}</div>
        </div>
      )
    },
    {
      key: 'type',
      header: 'Type',
      sortable: true,
      render: (value) => (
        <span className={`px-2 py-1 text-xs font-medium rounded-full font-roboto ${
          value === 'percentage' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
        }`}>
          {value === 'percentage' ? 'Percentage' : 'Fixed Amount'}
        </span>
      )
    },
    {
      key: 'value',
      header: 'Value',
      sortable: true,
      render: (value, item) => (
        <div className="flex items-center space-x-1">
          {item.type === 'percentage' ? (
            <>
              <Percent size={16} className="text-blue-600" />
              <span className="font-medium">{value}%</span>
            </>
          ) : (
            <>
              <IndianRupee size={16} className="text-green-600" />
              <span className="font-medium">{value.toLocaleString()}</span>
            </>
          )}
        </div>
      )
    },
    {
      key: 'applicableTo',
      header: 'Applicable To',
      render: (value) => (
        <div className="flex flex-wrap gap-1">
          {value.map((type, index) => (
            <span key={index} className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded-full">
              {type}
            </span>
          ))}
        </div>
      )
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      render: (value) => <StatusBadge status={value} type="product" />
    },
    {
      key: 'createdAt',
      header: 'Created',
      sortable: true,
      render: (value) => new Date(value).toLocaleDateString()
    },
    {
      key: 'id',
      header: 'Actions',
      render: (value, item) => (
        <div className="flex space-x-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setSelectedPricing(item);
            }}
            className="p-1 text-blue-600 hover:text-blue-800 transition-colors"
            title="View Details"
          >
            <Eye size={16} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              // Handle edit
            }}
            className="p-1 text-green-600 hover:text-green-800 transition-colors"
            title="Edit Pricing"
          >
            <Edit size={16} />
          </button>
        </div>
      )
    }
  ];

  const filteredPricing = pricingData.filter(pricing => {
    if (filters.type && pricing.type !== filters.type) return false;
    if (filters.status && pricing.status !== filters.status) return false;
    if (filters.applicableTo && !pricing.applicableTo.includes(filters.applicableTo)) return false;
    return true;
  });

  return (
    <div className="space-y-6 font-roboto animate-fade-in-left">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-primary">Pricing Management</h1>
          <p className="text-gray-600">Manage pricing rules and discounts</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => setShowAddPricing(true)}
            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-red-600 transition-colors flex items-center space-x-2"
          >
            <Plus size={16} />
            <span>Add Pricing Rule</span>
          </button>
          <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center space-x-2">
            <Download size={16} />
            <span>Export</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-primary">Filters</h3>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center space-x-2 text-gray-600 hover:text-primary transition-colors"
          >
            <Filter size={16} />
            <span>{showFilters ? 'Hide' : 'Show'} Filters</span>
          </button>
        </div>

        {showFilters && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
              <select
                value={filters.type}
                onChange={(e) => setFilters({ ...filters, type: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value="">All Types</option>
                <option value="percentage">Percentage</option>
                <option value="fixed">Fixed Amount</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
              <select
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value="">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Applicable To</label>
              <select
                value={filters.applicableTo}
                onChange={(e) => setFilters({ ...filters, applicableTo: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value="">All Types</option>
                <option value="general">General</option>
                <option value="architect">Architect</option>
                <option value="dealer">Dealer</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Pricing Table */}
      <Table
        data={filteredPricing}
        columns={columns}
        onRowClick={(pricing) => setSelectedPricing(pricing)}
        loading={false}
      />

      {/* Add Pricing Modal */}
      {showAddPricing && (
        <Modal
          isOpen={showAddPricing}
          onClose={() => setShowAddPricing(false)}
          title="Add New Pricing Rule"
          size="md"
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Rule Name</label>
              <input
                type="text"
                value={newPricing.name}
                onChange={(e) => setNewPricing({ ...newPricing, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="Enter pricing rule name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
              <select
                value={newPricing.type}
                onChange={(e) => setNewPricing({ ...newPricing, type: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value="percentage">Percentage</option>
                <option value="fixed">Fixed Amount</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Value</label>
              <input
                type="number"
                value={newPricing.value}
                onChange={(e) => setNewPricing({ ...newPricing, value: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder={newPricing.type === 'percentage' ? 'Enter percentage' : 'Enter amount'}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
              <textarea
                value={newPricing.description}
                onChange={(e) => setNewPricing({ ...newPricing, description: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                rows={3}
                placeholder="Enter description"
              />
            </div>
            <div className="flex space-x-3">
              <button
                onClick={handleAddPricing}
                className="flex-1 bg-primary text-white py-2 rounded-lg hover:bg-red-600 transition-colors"
              >
                Add Pricing Rule
              </button>
              <button
                onClick={() => setShowAddPricing(false)}
                className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Pricing Details Modal */}
      {selectedPricing && (
        <Modal
          isOpen={!!selectedPricing}
          onClose={() => setSelectedPricing(null)}
          title={`Pricing Details - ${selectedPricing.name}`}
          size="md"
        >
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="font-semibold text-gray-900">Rule Information</h4>
                <div className="mt-2 space-y-2 text-sm">
                  <div><span className="text-gray-600">Name:</span> {selectedPricing.name}</div>
                  <div><span className="text-gray-600">Type:</span> {selectedPricing.type}</div>
                  <div><span className="text-gray-600">Value:</span> {selectedPricing.type === 'percentage' ? `${selectedPricing.value}%` : `₹${selectedPricing.value.toLocaleString()}`}</div>
                  <div><span className="text-gray-600">Status:</span> <StatusBadge status={selectedPricing.status} type="product" /></div>
                </div>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">Applicable To</h4>
                <div className="mt-2">
                  {selectedPricing.applicableTo.map((type, index) => (
                    <span key={index} className="inline-block px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded-full mr-1 mb-1">
                      {type}
                    </span>
                  ))}
                </div>
              </div>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900">Description</h4>
              <p className="text-sm text-gray-600 mt-2">{selectedPricing.description}</p>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default PricingList;

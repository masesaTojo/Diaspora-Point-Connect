import React, { useState, useEffect } from 'react';
import { Property, PropertyUnitType } from '@/src/types';
import { Search, Plus, Edit, Trash2, Building2, MapPin, ShieldCheck, Calendar, X, Check, AlertTriangle, Users, FileText, DollarSign, Info } from 'lucide-react';
import { Button } from '@/src/components/ui/Button';

// For demo purposes, we'll use a local storage key for properties
const PROPERTIES_STORAGE_KEY = 'dpc_admin_properties';

const getStoredProperties = (): Property[] => {
  const stored = localStorage.getItem(PROPERTIES_STORAGE_KEY);
  if (stored) return JSON.parse(stored);
  
  // Return initial mock data if nothing is stored
  // We'll import these from the customer page's mock data if possible, 
  // but for a clean admin experience, let's define them here or import them.
  // Importing from customer page might be tricky due to circular dependencies if not careful.
  return []; 
};

const saveStoredProperties = (properties: Property[]) => {
  localStorage.setItem(PROPERTIES_STORAGE_KEY, JSON.stringify(properties));
};

export default function Properties() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Modal states
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [propertyToEdit, setPropertyToEdit] = useState<Property | null>(null);
  const [propertyToDelete, setPropertyToDelete] = useState<Property | null>(null);

  // Form fields
  const [formData, setFormData] = useState<Partial<Property>>({
    referenceNumber: '',
    originalProjectName: '',
    publicListingName: '',
    location: '',
    neighborhood: '',
    city: 'Nairobi',
    developer: '',
    propertyCompany: '',
    currentPrice: '',
    availableUnits: 0,
    paymentPlan: '',
    expectedCompletionDate: '',
    commissionRate: '',
    commissionTerms: '',
    contactDetails: '',
    status: 'Available',
    internalNotes: '',
    type: 'Apartment',
    isVerified: true,
    isNewDevelopment: true,
    description: '',
    amenities: [],
    images: ['https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1200&q=80'],
    unitTypes: [{ type: '', size: '', price: '' }],
    indicativeROI: '',
    priceByUnitType: '',
    exactProjectAddress: '',
    googleMapsLocation: '',
    parkingDetails: '',
    serviceCharge: '',
    informationSource: ''
  });

  useEffect(() => {
    const stored = getStoredProperties();
    if (stored.length === 0) {
      // In a real app, this would be an API call. 
      // For this build, we'll initialize with some data if empty.
      // But let's assume the user will add them.
    }
    setProperties(stored);
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleOpenAdd = () => {
    setPropertyToEdit(null);
    setFormData({
      referenceNumber: `DPC-${Math.floor(100 + Math.random() * 900)}`,
      originalProjectName: '',
      publicListingName: '',
      location: '',
      neighborhood: '',
      city: 'Nairobi',
      developer: '',
      propertyCompany: '',
      currentPrice: '',
      availableUnits: 1,
      paymentPlan: '',
      expectedCompletionDate: '',
      commissionRate: '',
      commissionTerms: '',
      contactDetails: '',
      status: 'Available',
      internalNotes: '',
      type: 'Apartment',
      isVerified: true,
      isNewDevelopment: true,
      description: '',
      amenities: [],
      images: ['https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1200&q=80'],
      unitTypes: [{ type: '', size: '', price: '' }]
    });
    setIsFormModalOpen(true);
  };

  const handleOpenEdit = (prop: Property) => {
    setPropertyToEdit(prop);
    setFormData(prop);
    setIsFormModalOpen(true);
  };

  const handleSaveProperty = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.publicListingName?.trim()) return;

    const now = new Date().toISOString().split('T')[0];

    if (propertyToEdit) {
      const updated = properties.map(p => {
        if (p.id === propertyToEdit.id) {
          return {
            ...p,
            ...formData,
            lastUpdated: now
          } as Property;
        }
        return p;
      });
      setProperties(updated);
      saveStoredProperties(updated);
      showToast(`Updated "${formData.publicListingName}" successfully.`);
    } else {
      const newProperty: Property = {
        ...formData,
        id: `prop-${Date.now()}`,
        lastUpdated: now,
        // Ensure required fields for compatibility
        priceUSD: typeof formData.currentPrice === 'number' ? formData.currentPrice : parseFloat(formData.currentPrice?.toString() || '0'),
        bedrooms: 2,
        bathrooms: 2,
        areaSqFt: 1200,
        rentalYield: '8-10%',
        titleStatus: 'Sectional Title Deed (99 Yrs)',
        title: formData.publicListingName || '',
      } as Property;
      
      const updated = [newProperty, ...properties];
      setProperties(updated);
      saveStoredProperties(updated);
      showToast(`Added new property listing "${newProperty.publicListingName}".`);
    }

    setIsFormModalOpen(false);
  };

  const handleDeleteConfirm = () => {
    if (!propertyToDelete) return;
    const updated = properties.filter(p => p.id !== propertyToDelete.id);
    setProperties(updated);
    saveStoredProperties(updated);
    showToast(`Removed property listing.`);
    setIsDeleteModalOpen(false);
    setPropertyToDelete(null);
  };

  const filteredProperties = properties.filter(p => {
    const matchesSearch = 
      p.publicListingName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.originalProjectName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.referenceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.location.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'ALL' || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-navy text-white px-4 py-3 rounded-xl shadow-lg flex items-center gap-2 border border-navy-light text-sm font-medium animate-in fade-in slide-in-from-bottom-3">
          <Check className="w-4 h-4 text-emerald-400" />
          {toastMessage}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-display font-bold text-navy">Property Management</h2>
          <p className="text-sm text-text-muted">Manage verified apartments, developments, and villas for diaspora investors.</p>
        </div>
        
        <Button onClick={handleOpenAdd} className="flex items-center gap-2 bg-navy hover:bg-navy-light shadow-sm">
          <Plus className="h-4 w-4" /> Add New Property
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 bg-white p-4 rounded-xl border border-neutral-200 shadow-sm">
        <div className="relative flex-1 min-w-[250px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
          <input 
            type="text"
            placeholder="Search by ID, project name, or location..."
            className="w-full pl-9 pr-4 py-2 border border-neutral-300 rounded-md focus:ring-navy focus:border-navy text-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <select
          className="px-3 py-2 border border-neutral-300 rounded-md text-sm bg-white focus:ring-navy focus:border-navy"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="ALL">All Statuses</option>
          <option value="Available">Available</option>
          <option value="Reserved">Reserved</option>
          <option value="Sold">Sold</option>
        </select>
      </div>

      {/* Property List */}
      <div className="bg-white rounded-xl border border-neutral-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-neutral-50 text-navy font-semibold border-b border-neutral-200">
              <tr>
                <th className="px-6 py-4 whitespace-nowrap">Ref & Names</th>
                <th className="px-6 py-4 whitespace-nowrap">Location & Developer</th>
                <th className="px-6 py-4 whitespace-nowrap">Price & Units</th>
                <th className="px-6 py-4 whitespace-nowrap">Commission (Private)</th>
                <th className="px-6 py-4 whitespace-nowrap">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {filteredProperties.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-text-muted">
                    {properties.length === 0 ? 'No properties listed yet. Click "Add New Property" to begin.' : 'No properties found matching filters.'}
                  </td>
                </tr>
              ) : (
                filteredProperties.map(prop => (
                  <tr key={prop.id} className="hover:bg-neutral-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="text-[10px] font-bold text-dpc-blue bg-blue-50 px-1.5 py-0.5 rounded w-fit mb-1 border border-blue-100">
                        {prop.referenceNumber}
                      </div>
                      <div className="font-bold text-navy">{prop.publicListingName}</div>
                      <div className="text-xs text-text-muted italic flex items-center gap-1 mt-0.5">
                        <Info className="w-3 h-3" /> Project: {prop.originalProjectName}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1 text-navy font-medium">
                        <MapPin className="w-3.5 h-3.5 text-dpc-blue" /> {prop.neighborhood}, {prop.city}
                      </div>
                      <div className="text-xs text-text-muted mt-1">Dev: {prop.developer}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-bold text-navy">${typeof prop.currentPrice === 'number' ? prop.currentPrice.toLocaleString() : prop.currentPrice}</div>
                      <div className="text-xs text-text-muted">{prop.availableUnits} units available</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-xs font-bold text-amber-700 bg-amber-50 px-2 py-1 rounded border border-amber-100 w-fit">
                        {prop.commissionRate} Rate
                      </div>
                      <div className="text-[10px] text-text-muted mt-1 truncate max-w-[150px]">{prop.commissionTerms}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${
                        prop.status === 'Available' ? 'bg-emerald-100 text-emerald-800' : 
                        prop.status === 'Reserved' ? 'bg-amber-100 text-amber-800' : 
                        'bg-red-100 text-red-800'
                      }`}>
                        {prop.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right space-x-1 whitespace-nowrap">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => handleOpenEdit(prop)}
                        className="text-navy hover:bg-neutral-100"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => { setPropertyToDelete(prop); setIsDeleteModalOpen(true); }}
                        className="text-red-500 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Property Modal */}
      {isFormModalOpen && (
        <div className="fixed inset-0 z-50 bg-navy/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl max-w-4xl w-full p-6 border border-neutral-200 animate-in fade-in zoom-in-95 my-8">
            <div className="flex justify-between items-center pb-4 border-b border-neutral-100 mb-6">
              <div>
                <h3 className="text-xl font-bold text-navy">
                  {propertyToEdit ? 'Edit Property Listing' : 'Create New Property Listing'}
                </h3>
                <p className="text-xs text-text-muted mt-0.5">Ensure all mandatory fields are completed for verification.</p>
              </div>
              <button 
                onClick={() => setIsFormModalOpen(false)}
                className="text-text-muted hover:text-navy p-1 rounded-md hover:bg-neutral-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProperty} className="space-y-8">
              
              {/* Section 1: Identification */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <div className="h-6 w-1 bg-navy rounded-full"></div>
                  <h4 className="text-sm font-bold text-navy uppercase tracking-wider">Property Identification</h4>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold text-navy uppercase mb-1">Property Ref # *</label>
                    <input 
                      type="text" 
                      required
                      placeholder="e.g. DPC-001" 
                      value={formData.referenceNumber}
                      onChange={(e) => setFormData({ ...formData, referenceNumber: e.target.value })}
                      className="w-full text-sm p-2.5 border border-neutral-300 rounded-lg focus:ring-navy focus:border-navy font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-navy uppercase mb-1">Original / Project Name (Admin Only) *</label>
                    <input 
                      type="text" 
                      required
                      placeholder="e.g. Aura Heights Phase 2" 
                      value={formData.originalProjectName}
                      onChange={(e) => setFormData({ ...formData, originalProjectName: e.target.value })}
                      className="w-full text-sm p-2.5 border border-neutral-300 rounded-lg focus:ring-navy focus:border-navy bg-amber-50/30"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-navy uppercase mb-1">Public Listing Name *</label>
                    <input 
                      type="text" 
                      required
                      placeholder="e.g. The Skyward Executive Apartments" 
                      value={formData.publicListingName}
                      onChange={(e) => setFormData({ ...formData, publicListingName: e.target.value })}
                      className="w-full text-sm p-2.5 border border-neutral-300 rounded-lg focus:ring-navy focus:border-navy"
                    />
                  </div>
                </div>
              </div>

              {/* Section 2: Location & Developer */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <div className="h-6 w-1 bg-dpc-blue rounded-full"></div>
                  <h4 className="text-sm font-bold text-navy uppercase tracking-wider">Location & Entity</h4>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-[11px] font-bold text-navy uppercase mb-1">Specific Location (Public) *</label>
                    <input 
                      type="text" 
                      required
                      placeholder="e.g. Off Dennis Pritt Road, Kilimani" 
                      value={formData.location}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                      className="w-full text-sm p-2.5 border border-neutral-300 rounded-lg"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-[11px] font-bold text-navy uppercase mb-1">Exact Project Address (Admin Only)</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Plot 123, Westlands Road" 
                      value={formData.exactProjectAddress}
                      onChange={(e) => setFormData({ ...formData, exactProjectAddress: e.target.value })}
                      className="w-full text-sm p-2.5 border border-neutral-300 rounded-lg bg-amber-50/30"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <div>
                    <label className="block text-[11px] font-bold text-navy uppercase mb-1">Google Maps Location Link (Admin Only)</label>
                    <input 
                      type="text" 
                      placeholder="https://maps.google.com/..." 
                      value={formData.googleMapsLocation}
                      onChange={(e) => setFormData({ ...formData, googleMapsLocation: e.target.value })}
                      className="w-full text-sm p-2.5 border border-neutral-300 rounded-lg bg-amber-50/30"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-navy uppercase mb-1">Information Source (Admin Only)</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Directly from Developer, Site Visit" 
                      value={formData.informationSource}
                      onChange={(e) => setFormData({ ...formData, informationSource: e.target.value })}
                      className="w-full text-sm p-2.5 border border-neutral-300 rounded-lg bg-amber-50/30"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
                  <div>
                    <label className="block text-[11px] font-bold text-navy uppercase mb-1">Neighborhood *</label>
                    <input 
                      type="text" 
                      required
                      placeholder="e.g. Kilimani" 
                      value={formData.neighborhood}
                      onChange={(e) => setFormData({ ...formData, neighborhood: e.target.value })}
                      className="w-full text-sm p-2.5 border border-neutral-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-navy uppercase mb-1">City *</label>
                    <select 
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      className="w-full text-sm p-2.5 border border-neutral-300 rounded-lg bg-white"
                    >
                      <option value="Nairobi">Nairobi</option>
                      <option value="Mombasa">Mombasa</option>
                      <option value="Naivasha">Naivasha</option>
                      <option value="Diani">Diani</option>
                      <option value="Nakuru">Nakuru</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <div>
                    <label className="block text-[11px] font-bold text-navy uppercase mb-1">Developer / Property Company *</label>
                    <input 
                      type="text" 
                      required
                      placeholder="e.g. Aura Heights Developments Ltd" 
                      value={formData.developer}
                      onChange={(e) => setFormData({ ...formData, developer: e.target.value, propertyCompany: e.target.value })}
                      className="w-full text-sm p-2.5 border border-neutral-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-navy uppercase mb-1">Dev/Agent Contact Details (Admin Only) *</label>
                    <input 
                      type="text" 
                      required
                      placeholder="e.g. John Doe, Sales Manager, +254 7XX XXX XXX" 
                      value={formData.contactDetails}
                      onChange={(e) => setFormData({ ...formData, contactDetails: e.target.value })}
                      className="w-full text-sm p-2.5 border border-neutral-300 rounded-lg bg-amber-50/30"
                    />
                  </div>
                </div>
              </div>

              {/* Section 3: Commercials */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <div className="h-6 w-1 bg-emerald-500 rounded-full"></div>
                  <h4 className="text-sm font-bold text-navy uppercase tracking-wider">Commercials & Availability</h4>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold text-navy uppercase mb-1">Current Price (Starting At) *</label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-text-muted" />
                      <input 
                        type="text" 
                        required
                        placeholder="e.g. 115,000" 
                        value={formData.currentPrice}
                        onChange={(e) => setFormData({ ...formData, currentPrice: e.target.value })}
                        className="w-full text-sm p-2.5 pl-8 border border-neutral-300 rounded-lg"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-navy uppercase mb-1">Available Units *</label>
                    <input 
                      type="number" 
                      required
                      min="0"
                      value={formData.availableUnits}
                      onChange={(e) => setFormData({ ...formData, availableUnits: parseInt(e.target.value) || 0 })}
                      className="w-full text-sm p-2.5 border border-neutral-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-navy uppercase mb-1">Expected Completion *</label>
                    <input 
                      type="text" 
                      required
                      placeholder="e.g. Q4 2026 or Ready" 
                      value={formData.expectedCompletionDate}
                      onChange={(e) => setFormData({ ...formData, expectedCompletionDate: e.target.value })}
                      className="w-full text-sm p-2.5 border border-neutral-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-navy uppercase mb-1">Property Status *</label>
                    <select 
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                      className="w-full text-sm p-2.5 border border-neutral-300 rounded-lg bg-white"
                    >
                      <option value="Available">Available</option>
                      <option value="Reserved">Reserved</option>
                      <option value="Sold">Sold</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                  <div>
                    <label className="block text-[11px] font-bold text-navy uppercase mb-1">Indicative ROI (Public) *</label>
                    <input 
                      type="text" 
                      required
                      placeholder="e.g. 11%-14%" 
                      value={formData.indicativeROI}
                      onChange={(e) => setFormData({ ...formData, indicativeROI: e.target.value })}
                      className="w-full text-sm p-2.5 border border-neutral-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-navy uppercase mb-1">Parking Details (Public)</label>
                    <input 
                      type="text" 
                      placeholder="e.g. 1 slot per unit, Ample visitor parking" 
                      value={formData.parkingDetails}
                      onChange={(e) => setFormData({ ...formData, parkingDetails: e.target.value })}
                      className="w-full text-sm p-2.5 border border-neutral-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-navy uppercase mb-1">Service Charge (Public)</label>
                    <input 
                      type="text" 
                      placeholder="e.g. KSh 10,000 per month" 
                      value={formData.serviceCharge}
                      onChange={(e) => setFormData({ ...formData, serviceCharge: e.target.value })}
                      className="w-full text-sm p-2.5 border border-neutral-300 rounded-lg"
                    />
                  </div>
                </div>
                <div className="mt-4">
                  <label className="block text-[11px] font-bold text-navy uppercase mb-1">Price by Unit Type / Floor (Admin Only)</label>
                  <textarea 
                    rows={2}
                    placeholder="e.g. 1BR 1-5th Floor: 6M, 6-10th Floor: 6.5M" 
                    value={formData.priceByUnitType}
                    onChange={(e) => setFormData({ ...formData, priceByUnitType: e.target.value })}
                    className="w-full text-sm p-2.5 border border-neutral-300 rounded-lg bg-amber-50/30"
                  />
                </div>
                <div className="mt-4">
                  <label className="block text-[11px] font-bold text-navy uppercase mb-1">Payment Plan Details *</label>
                  <textarea 
                    rows={2}
                    required
                    placeholder="e.g. 20% Deposit, 80% over 30 months milestone-based installments." 
                    value={formData.paymentPlan}
                    onChange={(e) => setFormData({ ...formData, paymentPlan: e.target.value })}
                    className="w-full text-sm p-2.5 border border-neutral-300 rounded-lg"
                  />
                </div>
              </div>

              {/* Section 4: Commission & Private Notes */}
              <div className="bg-amber-50/50 p-5 rounded-2xl border border-amber-100">
                <div className="flex items-center gap-2 mb-4">
                  <ShieldCheck className="w-4 h-4 text-amber-700" />
                  <h4 className="text-sm font-bold text-amber-900 uppercase tracking-wider">Internal Admin Controls (Private)</h4>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold text-amber-900 uppercase mb-1">Commission Rate (%) *</label>
                    <input 
                      type="text" 
                      required
                      placeholder="e.g. 5% of Sale Price" 
                      value={formData.commissionRate}
                      onChange={(e) => setFormData({ ...formData, commissionRate: e.target.value })}
                      className="w-full text-sm p-2.5 border border-amber-200 rounded-lg bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-amber-900 uppercase mb-1">Commission Payment Terms *</label>
                    <input 
                      type="text" 
                      required
                      placeholder="e.g. 50% on Deposit, 50% on 2nd Milestone" 
                      value={formData.commissionTerms}
                      onChange={(e) => setFormData({ ...formData, commissionTerms: e.target.value })}
                      className="w-full text-sm p-2.5 border border-amber-200 rounded-lg bg-white"
                    />
                  </div>
                </div>
                <div className="mt-4">
                  <label className="block text-[11px] font-bold text-amber-900 uppercase mb-1">Internal Notes (Market Intelligence, Issues, etc.)</label>
                  <textarea 
                    rows={2}
                    placeholder="e.g. Developer delayed on last project. Requires frequent site visits." 
                    value={formData.internalNotes}
                    onChange={(e) => setFormData({ ...formData, internalNotes: e.target.value })}
                    className="w-full text-sm p-2.5 border border-amber-200 rounded-lg bg-white"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-6 border-t border-neutral-100">
                <Button type="button" variant="outline" onClick={() => setIsFormModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" className="bg-navy hover:bg-navy-light text-white px-8">
                  {propertyToEdit ? 'Save Changes' : 'Publish Property Listing'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && propertyToDelete && (
        <div className="fixed inset-0 z-50 bg-navy/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6 border border-neutral-200 animate-in fade-in zoom-in-95">
            <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-navy text-center mb-1">Remove Listing?</h3>
            <p className="text-xs text-text-muted text-center mb-6">
              Are you sure you want to delete <strong>"{propertyToDelete.publicListingName}"</strong>? This action cannot be undone.
            </p>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                className="flex-1"
                onClick={() => { setIsDeleteModalOpen(false); setPropertyToDelete(null); }}
              >
                Cancel
              </Button>
              <Button 
                className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                onClick={handleDeleteConfirm}
              >
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

import React, { useState } from 'react';
import { mockDeliveryZones, mockDrivers } from '@/src/lib/mockData';
import { Truck, Map, Clock, Plus, UserCheck, AlertTriangle } from 'lucide-react';
import { Button } from '@/src/components/ui/Button';

export default function Logistics() {
  const [activeTab, setActiveTab] = useState<'zones' | 'drivers'>('zones');

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-display font-bold text-navy">Logistics & Delivery</h2>
          <p className="text-sm text-text-muted">Manage delivery zones, fees, and delivery personnel.</p>
        </div>
        
        <div className="flex gap-2">
          {activeTab === 'zones' ? (
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" /> Add Delivery Zone
            </Button>
          ) : (
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" /> Add Driver
            </Button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-neutral-200">
        <button
          className={`px-6 py-3 text-sm font-bold border-b-2 transition-colors ${activeTab === 'zones' ? 'border-dpc-blue text-dpc-blue' : 'border-transparent text-text-muted hover:text-navy'}`}
          onClick={() => setActiveTab('zones')}
        >
          Delivery Zones
        </button>
        <button
          className={`px-6 py-3 text-sm font-bold border-b-2 transition-colors ${activeTab === 'drivers' ? 'border-dpc-blue text-dpc-blue' : 'border-transparent text-text-muted hover:text-navy'}`}
          onClick={() => setActiveTab('drivers')}
        >
          Drivers & Fleet
        </button>
      </div>

      {activeTab === 'zones' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {mockDeliveryZones.map(zone => (
            <div key={zone.id} className="bg-white rounded-xl border border-neutral-200 p-6 shadow-sm">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-blue-50 text-dpc-blue rounded-lg">
                    <Map className="h-5 w-5" />
                  </div>
                  <h3 className="text-lg font-bold text-navy">{zone.name}</h3>
                </div>
                <div className="text-right">
                  <div className="font-bold text-lg text-dpc-blue">${zone.fee.toFixed(2)}</div>
                  <div className="text-xs text-text-muted">Delivery Fee</div>
                </div>
              </div>
              
              <div className="space-y-3 text-sm border-t border-neutral-100 pt-4">
                <div className="flex items-center justify-between">
                  <span className="text-text-muted flex items-center gap-2"><Clock className="w-4 h-4" /> Est. Time</span>
                  <span className="font-medium text-navy">{zone.estimatedTime}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-text-muted">Min. Order</span>
                  <span className="font-medium text-navy">${zone.minimumOrder.toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-text-muted">Same Day</span>
                  <span className={`font-medium ${zone.sameDayAvailable ? 'text-green-600' : 'text-text-muted'}`}>
                    {zone.sameDayAvailable ? 'Yes' : 'No'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-text-muted">Scheduled</span>
                  <span className={`font-medium ${zone.scheduledAvailable ? 'text-green-600' : 'text-text-muted'}`}>
                    {zone.scheduledAvailable ? 'Yes' : 'No'}
                  </span>
                </div>
              </div>
              
              <div className="mt-6">
                <Button variant="outline" className="w-full">Edit Config</Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'drivers' && (
        <div className="bg-white rounded-xl border border-neutral-200 shadow-sm overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-neutral-50 text-navy font-semibold border-b border-neutral-200">
              <tr>
                <th className="px-6 py-4 whitespace-nowrap">Driver Name</th>
                <th className="px-6 py-4 whitespace-nowrap">Contact</th>
                <th className="px-6 py-4 whitespace-nowrap">Status</th>
                <th className="px-6 py-4 whitespace-nowrap">Current Zone</th>
                <th className="px-6 py-4 whitespace-nowrap text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {mockDrivers.map(driver => {
                const zone = mockDeliveryZones.find(z => z.id === driver.currentZoneId);
                return (
                  <tr key={driver.id} className="hover:bg-neutral-50">
                    <td className="px-6 py-4 font-bold text-navy flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-neutral-200 flex items-center justify-center text-text-muted">
                        <UserCheck className="w-4 h-4" />
                      </div>
                      {driver.name}
                    </td>
                    <td className="px-6 py-4 text-text-muted">{driver.phone}</td>
                    <td className="px-6 py-4">
                      {driver.status === 'AVAILABLE' && <span className="px-2 py-1 rounded text-xs font-bold bg-green-100 text-green-800">Available</span>}
                      {driver.status === 'ON_DELIVERY' && <span className="px-2 py-1 rounded text-xs font-bold bg-blue-100 text-blue-800">On Delivery</span>}
                      {driver.status === 'OFF_DUTY' && <span className="px-2 py-1 rounded text-xs font-bold bg-gray-100 text-gray-800">Off Duty</span>}
                    </td>
                    <td className="px-6 py-4 text-text-muted">
                      {zone ? zone.name : 'Unassigned'}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Button variant="ghost" size="sm">Manage</Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { DeliveryZone, Driver } from '@/src/types';
import { useShop } from '@/src/contexts/ShopContext';
import { useAuth } from '@/src/contexts/AuthContext';
import { db } from '@/src/lib/firebase';
import { collection, deleteDoc, doc, onSnapshot, orderBy, query, setDoc } from 'firebase/firestore';
import { buildFirestoreErrorInfo, OperationType, stripUndefined } from '@/src/lib/firestoreErrors';
import { Truck, Map, Clock, Plus, X, Check, Edit, Trash2, Phone, ShieldCheck } from 'lucide-react';
import { Button } from '@/src/components/ui/Button';

export default function Logistics() {
  const { deliveryZones: zones } = useShop();
  const { currentUser, logAction } = useAuth();
  const [activeTab, setActiveTab] = useState<'zones' | 'drivers'>('zones');
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Modals
  const [isZoneModalOpen, setIsZoneModalOpen] = useState(false);
  const [editingZone, setEditingZone] = useState<DeliveryZone | null>(null);

  const [isDriverModalOpen, setIsDriverModalOpen] = useState(false);
  const [editingDriver, setEditingDriver] = useState<Driver | null>(null);

  // Zone Form
  const [zoneForm, setZoneForm] = useState({
    name: '',
    fee: 15,
    estimatedTime: 'Same Day (Within 4 Hours)',
    minimumOrder: 30,
    sameDayAvailable: true,
    scheduledAvailable: true,
    postalCodes: '00100, 00200, 00505'
  });

  // Driver Form
  const [driverForm, setDriverForm] = useState({
    name: '',
    phone: '+254 7',
    currentZoneId: '',
    status: 'AVAILABLE' as 'AVAILABLE' | 'ON_DELIVERY' | 'OFF_DUTY'
  });

  useEffect(() => {
    if (!currentUser) return;
    const unsub = onSnapshot(
      query(collection(db, 'drivers'), orderBy('name')),
      (snap) => {
        setDrivers(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Driver)));
      },
      (err) => {
        console.error('Drivers listener error:', JSON.stringify(buildFirestoreErrorInfo(err, OperationType.LIST, 'drivers')));
      }
    );
    return () => unsub();
  }, [currentUser]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleOpenAddZone = () => {
    setEditingZone(null);
    setZoneForm({
      name: '',
      fee: 15,
      estimatedTime: 'Same Day (Within 4 Hours)',
      minimumOrder: 30,
      sameDayAvailable: true,
      scheduledAvailable: true,
      postalCodes: '00100, 00200'
    });
    setIsZoneModalOpen(true);
  };

  const handleOpenEditZone = (zone: DeliveryZone) => {
    setEditingZone(zone);
    setZoneForm({
      name: zone.name,
      fee: zone.fee,
      estimatedTime: zone.estimatedTime || '',
      minimumOrder: zone.minimumOrder ?? 0,
      sameDayAvailable: Boolean(zone.sameDayAvailable),
      scheduledAvailable: Boolean(zone.scheduledAvailable),
      postalCodes: (zone.postalCodes || []).join(', ')
    });
    setIsZoneModalOpen(true);
  };

  const handleSaveZone = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!zoneForm.name.trim() || saving) return;

    setSaving(true);
    try {
      const zoneId = editingZone ? editingZone.id : `zone-${Date.now()}`;
      const postalList = zoneForm.postalCodes.split(',').map(s => s.trim()).filter(Boolean);
      const payload: DeliveryZone = stripUndefined({
        id: zoneId,
        name: zoneForm.name.trim(),
        fee: Number(zoneForm.fee),
        estimatedTime: zoneForm.estimatedTime.trim(),
        minimumOrder: Number(zoneForm.minimumOrder),
        sameDayAvailable: zoneForm.sameDayAvailable,
        scheduledAvailable: zoneForm.scheduledAvailable,
        ...(postalList.length > 0 ? { postalCodes: postalList } : {}),
      });

      await setDoc(doc(db, 'deliveryZones', zoneId), payload);
      await logAction(
        editingZone ? 'UPDATE' : 'CREATE',
        'DeliveryZone',
        zoneId,
        editingZone?.name,
        payload.name
      );
      showToast(editingZone ? `Updated delivery zone "${payload.name}".` : `Added delivery zone "${payload.name}".`);
      setIsZoneModalOpen(false);
    } catch (err) {
      console.error('Delivery zone save error:', JSON.stringify(buildFirestoreErrorInfo(err, OperationType.WRITE, 'deliveryZones')));
      showToast('Failed to save delivery zone in Firestore.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteZone = async (zoneId: string) => {
    if (saving) return;
    setSaving(true);
    try {
      await deleteDoc(doc(db, 'deliveryZones', zoneId));
      await logAction('DELETE', 'DeliveryZone', zoneId);
      showToast('Delivery zone removed.');
    } catch (err) {
      console.error('Delivery zone delete error:', JSON.stringify(buildFirestoreErrorInfo(err, OperationType.DELETE, `deliveryZones/${zoneId}`)));
      showToast('Failed to remove delivery zone.');
    } finally {
      setSaving(false);
    }
  };

  const handleOpenAddDriver = () => {
    setEditingDriver(null);
    setDriverForm({
      name: '',
      phone: '+254 7',
      currentZoneId: zones[0]?.id || '',
      status: 'AVAILABLE'
    });
    setIsDriverModalOpen(true);
  };

  const handleOpenEditDriver = (driver: Driver) => {
    setEditingDriver(driver);
    setDriverForm({
      name: driver.name,
      phone: driver.phone,
      currentZoneId: driver.currentZoneId || '',
      status: driver.status
    });
    setIsDriverModalOpen(true);
  };

  const handleSaveDriver = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!driverForm.name.trim() || saving) return;

    setSaving(true);
    try {
      const driverId = editingDriver ? editingDriver.id : `drv-${Date.now()}`;
      const assignedZoneId = driverForm.currentZoneId || zones[0]?.id;
      const payload: Driver = stripUndefined({
        id: driverId,
        name: driverForm.name.trim(),
        phone: driverForm.phone.trim(),
        status: driverForm.status,
        ...(assignedZoneId ? { currentZoneId: assignedZoneId } : {}),
      });

      await setDoc(doc(db, 'drivers', driverId), payload);
      await logAction(
        editingDriver ? 'UPDATE' : 'CREATE',
        'Driver',
        driverId,
        editingDriver?.name,
        payload.name
      );
      showToast(editingDriver ? `Updated driver details for ${payload.name}.` : `Added driver ${payload.name} to fleet.`);
      setIsDriverModalOpen(false);
    } catch (err) {
      console.error('Driver save error:', JSON.stringify(buildFirestoreErrorInfo(err, OperationType.WRITE, 'drivers')));
      showToast('Failed to save driver in Firestore.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteDriver = async (driverId: string) => {
    if (saving) return;
    setSaving(true);
    try {
      await deleteDoc(doc(db, 'drivers', driverId));
      await logAction('DELETE', 'Driver', driverId);
      showToast('Driver removed from fleet.');
      setIsDriverModalOpen(false);
    } catch (err) {
      console.error('Driver delete error:', JSON.stringify(buildFirestoreErrorInfo(err, OperationType.DELETE, `drivers/${driverId}`)));
      showToast('Failed to remove driver from Firestore.');
    } finally {
      setSaving(false);
    }
  };

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
          <h2 className="text-2xl font-display font-bold text-navy">Logistics & Delivery</h2>
          <p className="text-sm text-text-muted">Manage Kenya delivery coverage zones, delivery windows, and courier fleet.</p>
        </div>
        
        <div className="flex gap-2">
          {activeTab === 'zones' ? (
            <Button onClick={handleOpenAddZone} className="flex items-center gap-2 bg-dpc-blue hover:bg-dpc-blue/90">
              <Plus className="h-4 w-4" /> Add Delivery Zone
            </Button>
          ) : (
            <Button onClick={handleOpenAddDriver} className="flex items-center gap-2 bg-dpc-blue hover:bg-dpc-blue/90">
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
          Delivery Zones ({zones.length})
        </button>
        <button
          className={`px-6 py-3 text-sm font-bold border-b-2 transition-colors ${activeTab === 'drivers' ? 'border-dpc-blue text-dpc-blue' : 'border-transparent text-text-muted hover:text-navy'}`}
          onClick={() => setActiveTab('drivers')}
        >
          Drivers & Fleet ({drivers.length})
        </button>
      </div>

      {activeTab === 'zones' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {zones.map(zone => (
            <div key={zone.id} className="bg-white rounded-xl border border-neutral-200 p-6 shadow-sm flex flex-col justify-between">
              <div>
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
                    <span className="font-medium text-navy">${(zone.minimumOrder ?? 0).toFixed(2)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-text-muted">Same Day Delivery</span>
                    <span className={`font-semibold ${zone.sameDayAvailable ? 'text-emerald-600' : 'text-neutral-400'}`}>
                      {zone.sameDayAvailable ? 'Active' : 'Disabled'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-text-muted">Scheduled Delivery</span>
                    <span className={`font-semibold ${zone.scheduledAvailable ? 'text-emerald-600' : 'text-neutral-400'}`}>
                      {zone.scheduledAvailable ? 'Active' : 'Disabled'}
                    </span>
                  </div>
                  <div className="pt-2 text-xs text-text-muted">
                    <span className="font-semibold text-navy">Postal / Area codes: </span>
                    {(zone.postalCodes || []).join(', ') || 'All city zones'}
                  </div>
                </div>
              </div>
              
              <div className="mt-6 pt-4 border-t border-neutral-100 flex gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => handleOpenEditZone(zone)}
                  className="flex-1 text-xs"
                >
                  <Edit className="w-3.5 h-3.5 mr-1" /> Edit Config
                </Button>
                {zones.length > 1 && (
                  <Button 
                    variant="ghost" 
                    onClick={() => handleDeleteZone(zone.id)}
                    className="text-red-500 hover:bg-red-50 px-3"
                    title="Remove Zone"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
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
              {drivers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-text-muted">
                    No fleet drivers registered yet. Add a driver to enable dispatch assignment.
                  </td>
                </tr>
              ) : (
                drivers.map(driver => {
                  const zone = zones.find(z => z.id === driver.currentZoneId);
                  return (
                    <tr key={driver.id} className="hover:bg-neutral-50">
                      <td className="px-6 py-4 font-bold text-navy flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-blue-100 text-dpc-blue flex items-center justify-center font-bold text-xs">
                          {driver.name.split(' ').map(n => n[0]).join('')}
                        </div>
                        <div>
                          <div>{driver.name}</div>
                          <div className="text-xs font-normal text-text-muted flex items-center gap-1">
                            <ShieldCheck className="w-3 h-3 text-emerald-600" /> Verified Courier
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-text-muted font-mono text-xs">
                        <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> {driver.phone}</span>
                      </td>
                      <td className="px-6 py-4">
                        {driver.status === 'AVAILABLE' && <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">Available</span>}
                        {driver.status === 'ON_DELIVERY' && <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800">On Delivery</span>}
                        {driver.status === 'OFF_DUTY' && <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-neutral-100 text-neutral-600">Off Duty</span>}
                      </td>
                      <td className="px-6 py-4 text-text-muted">
                        {zone ? (
                          <span className="inline-flex items-center gap-1 text-navy font-medium">
                            <Map className="w-3.5 h-3.5 text-dpc-blue" /> {zone.name}
                          </span>
                        ) : 'Unassigned'}
                      </td>
                      <td className="px-6 py-4 text-right space-x-2">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleOpenEditDriver(driver)}
                          className="text-dpc-blue hover:bg-blue-50 text-xs font-semibold"
                        >
                          Manage
                        </Button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Add / Edit Zone Modal */}
      {isZoneModalOpen && (
        <div className="fixed inset-0 z-50 bg-navy/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 border border-neutral-200 animate-in fade-in zoom-in-95">
            <div className="flex justify-between items-center pb-3 border-b border-neutral-100 mb-4">
              <h3 className="text-lg font-bold text-navy flex items-center gap-2">
                <Map className="w-5 h-5 text-dpc-blue" />
                {editingZone ? 'Edit Delivery Zone' : 'Add Delivery Zone'}
              </h3>
              <button onClick={() => setIsZoneModalOpen(false)} className="text-text-muted hover:text-navy">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveZone} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-navy mb-1">Zone Name *</label>
                <input 
                  type="text" 
                  required
                  value={zoneForm.name}
                  onChange={(e) => setZoneForm({ ...zoneForm, name: e.target.value })}
                  placeholder="e.g. Kisumu Metro & Environs"
                  className="w-full text-sm p-2.5 border border-neutral-300 rounded-lg"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-navy mb-1">Delivery Fee ($) *</label>
                  <input 
                    type="number" 
                    step="0.01"
                    min="0"
                    required
                    value={zoneForm.fee}
                    onChange={(e) => setZoneForm({ ...zoneForm, fee: parseFloat(e.target.value) || 0 })}
                    className="w-full text-sm p-2.5 border border-neutral-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-navy mb-1">Min. Order ($) *</label>
                  <input 
                    type="number" 
                    step="0.01"
                    min="0"
                    required
                    value={zoneForm.minimumOrder}
                    onChange={(e) => setZoneForm({ ...zoneForm, minimumOrder: parseFloat(e.target.value) || 0 })}
                    className="w-full text-sm p-2.5 border border-neutral-300 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-navy mb-1">Estimated Delivery Time Window</label>
                <input 
                  type="text" 
                  required
                  value={zoneForm.estimatedTime}
                  onChange={(e) => setZoneForm({ ...zoneForm, estimatedTime: e.target.value })}
                  placeholder="e.g. Same Day (Within 4 Hours) or 24-48 Hours"
                  className="w-full text-sm p-2.5 border border-neutral-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-navy mb-1">Postal / Area Codes (comma separated)</label>
                <input 
                  type="text" 
                  value={zoneForm.postalCodes}
                  onChange={(e) => setZoneForm({ ...zoneForm, postalCodes: e.target.value })}
                  placeholder="00100, 00200, Westlands, Kilimani"
                  className="w-full text-sm p-2.5 border border-neutral-300 rounded-lg"
                />
              </div>

              <div className="space-y-2 pt-2">
                <label className="flex items-center gap-2 text-sm text-navy cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={zoneForm.sameDayAvailable}
                    onChange={(e) => setZoneForm({ ...zoneForm, sameDayAvailable: e.target.checked })}
                    className="rounded text-dpc-blue focus:ring-dpc-blue h-4 w-4"
                  />
                  <span>Enable Same-Day Delivery</span>
                </label>
                <label className="flex items-center gap-2 text-sm text-navy cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={zoneForm.scheduledAvailable}
                    onChange={(e) => setZoneForm({ ...zoneForm, scheduledAvailable: e.target.checked })}
                    className="rounded text-dpc-blue focus:ring-dpc-blue h-4 w-4"
                  />
                  <span>Enable Scheduled (Future Date) Delivery</span>
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-neutral-100">
                <Button type="button" variant="outline" onClick={() => setIsZoneModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={saving} className="bg-dpc-blue hover:bg-dpc-blue/90 text-white font-bold">
                  {saving ? 'Saving...' : editingZone ? 'Save Zone' : 'Create Zone'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add / Edit Driver Modal */}
      {isDriverModalOpen && (
        <div className="fixed inset-0 z-50 bg-navy/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 border border-neutral-200 animate-in fade-in zoom-in-95">
            <div className="flex justify-between items-center pb-3 border-b border-neutral-100 mb-4">
              <h3 className="text-lg font-bold text-navy flex items-center gap-2">
                <Truck className="w-5 h-5 text-dpc-blue" />
                {editingDriver ? 'Manage Driver' : 'Add Fleet Driver'}
              </h3>
              <button onClick={() => setIsDriverModalOpen(false)} className="text-text-muted hover:text-navy">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveDriver} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-navy mb-1">Driver Full Name *</label>
                <input 
                  type="text" 
                  required
                  value={driverForm.name}
                  onChange={(e) => setDriverForm({ ...driverForm, name: e.target.value })}
                  placeholder="e.g. Samuel Mutua"
                  className="w-full text-sm p-2.5 border border-neutral-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-navy mb-1">Phone Number (M-Pesa / WhatsApp) *</label>
                <input 
                  type="tel" 
                  required
                  value={driverForm.phone}
                  onChange={(e) => setDriverForm({ ...driverForm, phone: e.target.value })}
                  placeholder="+254 712 345 678"
                  className="w-full text-sm p-2.5 border border-neutral-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-navy mb-1">Assigned Delivery Zone</label>
                <select 
                  value={driverForm.currentZoneId}
                  onChange={(e) => setDriverForm({ ...driverForm, currentZoneId: e.target.value })}
                  className="w-full text-sm p-2.5 border border-neutral-300 rounded-lg bg-white"
                >
                  {zones.map(z => (
                    <option key={z.id} value={z.id}>{z.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-navy mb-1">Current Shift Status</label>
                <select 
                  value={driverForm.status}
                  onChange={(e) => setDriverForm({ ...driverForm, status: e.target.value as any })}
                  className="w-full text-sm p-2.5 border border-neutral-300 rounded-lg bg-white"
                >
                  <option value="AVAILABLE">Available (Ready for Dispatch)</option>
                  <option value="ON_DELIVERY">On Delivery</option>
                  <option value="OFF_DUTY">Off Duty</option>
                </select>
              </div>

              <div className="flex justify-between items-center pt-3 border-t border-neutral-100">
                {editingDriver ? (
                  <button 
                    type="button" 
                    disabled={saving}
                    onClick={() => handleDeleteDriver(editingDriver.id)}
                    className="text-xs text-red-600 hover:underline flex items-center gap-1 font-semibold"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Remove Driver
                  </button>
                ) : <div />}

                <div className="flex gap-2">
                  <Button type="button" variant="outline" onClick={() => setIsDriverModalOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={saving} className="bg-dpc-blue hover:bg-dpc-blue/90 text-white font-bold">
                    {saving ? 'Saving...' : editingDriver ? 'Save Changes' : 'Add to Fleet'}
                  </Button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

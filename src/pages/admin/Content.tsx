import React, { useState, useEffect } from 'react';
import { CmsSection } from '@/src/types';
import { getStoredCmsSections, saveStoredCmsSections } from '@/src/lib/adminStorage';
import { GripVertical, Eye, EyeOff, Edit, MoveUp, MoveDown, Plus, Check, X, LayoutTemplate } from 'lucide-react';
import { Button } from '@/src/components/ui/Button';

export default function Content() {
  const [sections, setSections] = useState<CmsSection[]>([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Edit/Add modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSection, setEditingSection] = useState<CmsSection | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    type: 'HERO_BANNER' as CmsSection['type'],
    isVisible: true
  });

  useEffect(() => {
    const loaded = getStoredCmsSections().sort((a, b) => a.order - b.order);
    setSections(loaded);
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleSaveAll = () => {
    saveStoredCmsSections(sections);
    showToast('Homepage CMS layout saved successfully.');
  };

  const toggleVisibility = (id: string) => {
    const updated = sections.map(s => s.id === id ? { ...s, isVisible: !s.isVisible } : s);
    setSections(updated);
    saveStoredCmsSections(updated);
    showToast('Section visibility updated.');
  };

  const moveUp = (index: number) => {
    if (index === 0) return;
    const newSections = [...sections];
    const temp = newSections[index];
    newSections[index] = newSections[index - 1];
    newSections[index - 1] = temp;
    
    // Re-index orders
    const reordered = newSections.map((s, idx) => ({ ...s, order: idx + 1 }));
    setSections(reordered);
    saveStoredCmsSections(reordered);
  };

  const moveDown = (index: number) => {
    if (index === sections.length - 1) return;
    const newSections = [...sections];
    const temp = newSections[index];
    newSections[index] = newSections[index + 1];
    newSections[index + 1] = temp;
    
    // Re-index orders
    const reordered = newSections.map((s, idx) => ({ ...s, order: idx + 1 }));
    setSections(reordered);
    saveStoredCmsSections(reordered);
  };

  const handleOpenAdd = () => {
    setEditingSection(null);
    setFormData({
      title: '',
      type: 'PROMO_GRID',
      isVisible: true
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (section: CmsSection) => {
    setEditingSection(section);
    setFormData({
      title: section.title,
      type: section.type,
      isVisible: section.isVisible
    });
    setIsModalOpen(true);
  };

  const handleSaveModal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) return;

    if (editingSection) {
      const updated = sections.map(s => {
        if (s.id === editingSection.id) {
          return {
            ...s,
            title: formData.title,
            type: formData.type,
            isVisible: formData.isVisible
          };
        }
        return s;
      });
      setSections(updated);
      saveStoredCmsSections(updated);
      showToast(`Updated section "${formData.title}".`);
    } else {
      const newSection: CmsSection = {
        id: `sec-${Date.now()}`,
        title: formData.title,
        type: formData.type,
        order: sections.length + 1,
        isVisible: formData.isVisible,
        items: []
      };
      const updated = [...sections, newSection];
      setSections(updated);
      saveStoredCmsSections(updated);
      showToast(`Created new homepage section "${newSection.title}".`);
    }

    setIsModalOpen(false);
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

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-display font-bold text-navy">Content & CMS</h2>
          <p className="text-sm text-text-muted">Manage storefront sections, promotional banners, and featured collections.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleOpenAdd} className="flex items-center gap-2">
            <Plus className="h-4 w-4" /> Add Section
          </Button>
          <Button onClick={handleSaveAll} className="bg-dpc-blue hover:bg-dpc-blue/90 text-white font-bold">
            Save Layout
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-neutral-200 shadow-sm overflow-hidden p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-navy flex items-center gap-2">
            <LayoutTemplate className="w-5 h-5 text-dpc-blue" /> Storefront Homepage Sections
          </h3>
          <span className="text-xs text-text-muted">Use arrows to adjust vertical display order</span>
        </div>

        <div className="space-y-2">
          {sections.map((section, idx) => (
            <div 
              key={section.id} 
              className={`flex items-center justify-between p-3.5 border rounded-xl transition-all ${
                section.isVisible ? 'bg-white border-neutral-200 shadow-xs' : 'bg-neutral-50 border-neutral-200/60 opacity-60'
              }`}
            >
              <div className="flex items-center gap-4">
                <div className="flex items-center justify-center w-6 h-6 rounded bg-neutral-100 font-mono text-xs font-bold text-text-muted">
                  {idx + 1}
                </div>
                <div>
                  <span className="font-bold text-navy block text-sm">{section.title}</span>
                  <span className="text-xs font-mono text-text-muted uppercase tracking-wider">{section.type.replace('_', ' ')}</span>
                </div>
              </div>
              
              <div className="flex items-center gap-1.5">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => moveUp(idx)} 
                  disabled={idx === 0}
                  className="h-8 w-8 p-0 text-text-muted hover:text-navy disabled:opacity-30"
                  title="Move Up"
                >
                  <MoveUp className="h-4 w-4" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => moveDown(idx)} 
                  disabled={idx === sections.length - 1}
                  className="h-8 w-8 p-0 text-text-muted hover:text-navy disabled:opacity-30"
                  title="Move Down"
                >
                  <MoveDown className="h-4 w-4" />
                </Button>
                <div className="w-px h-5 bg-neutral-200 mx-1"></div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => toggleVisibility(section.id)}
                  className="h-8 px-2 text-xs"
                  title={section.isVisible ? 'Hide Section' : 'Show Section'}
                >
                  {section.isVisible ? (
                    <span className="flex items-center gap-1 text-emerald-700 font-medium">
                      <Eye className="h-4 w-4" /> Visible
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-text-muted">
                      <EyeOff className="h-4 w-4" /> Hidden
                    </span>
                  )}
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => handleOpenEdit(section)}
                  className="text-dpc-blue hover:bg-blue-50 h-8 w-8 p-0"
                  title="Edit Section Details"
                >
                  <Edit className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Add / Edit Section Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-navy/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 border border-neutral-200 animate-in fade-in zoom-in-95">
            <div className="flex justify-between items-center pb-3 border-b border-neutral-100 mb-4">
              <h3 className="text-lg font-bold text-navy">
                {editingSection ? 'Edit Homepage Section' : 'Add New Section'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-text-muted hover:text-navy">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveModal} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-navy mb-1">Section Display Title *</label>
                <input 
                  type="text" 
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. Curated Mother's Day Specials"
                  className="w-full text-sm p-2.5 border border-neutral-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-navy mb-1">Section Component Type</label>
                <select 
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                  className="w-full text-sm p-2.5 border border-neutral-300 rounded-lg bg-white"
                >
                  <option value="HERO_BANNER">Hero Showcase Banner</option>
                  <option value="FEATURED_CATEGORIES">Featured Categories Carousel</option>
                  <option value="PRODUCT_CAROUSEL">Product Grid / Carousel</option>
                  <option value="PROMO_GRID">Diaspora Promotional Highlights</option>
                  <option value="CUSTOM_HTML">Custom Rich Content</option>
                </select>
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm text-navy cursor-pointer pt-2">
                  <input 
                    type="checkbox" 
                    checked={formData.isVisible}
                    onChange={(e) => setFormData({ ...formData, isVisible: e.target.checked })}
                    className="rounded text-dpc-blue focus:ring-dpc-blue h-4 w-4"
                  />
                  <span>Publish & Display on Homepage</span>
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-neutral-100">
                <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" className="bg-dpc-blue hover:bg-dpc-blue/90 text-white font-bold">
                  {editingSection ? 'Save Changes' : 'Create Section'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}


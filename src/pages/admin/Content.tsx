import React, { useState } from 'react';
import { mockCmsSections } from '@/src/lib/mockData';
import { GripVertical, Eye, EyeOff, Edit, MoveUp, MoveDown } from 'lucide-react';
import { Button } from '@/src/components/ui/Button';

export default function Content() {
  const [sections, setSections] = useState([...mockCmsSections].sort((a, b) => a.order - b.order));

  const toggleVisibility = (id: string) => {
    setSections(sections.map(s => s.id === id ? { ...s, isVisible: !s.isVisible } : s));
  };

  const moveUp = (index: number) => {
    if (index === 0) return;
    const newSections = [...sections];
    const temp = newSections[index];
    newSections[index] = newSections[index - 1];
    newSections[index - 1] = temp;
    setSections(newSections);
  };

  const moveDown = (index: number) => {
    if (index === sections.length - 1) return;
    const newSections = [...sections];
    const temp = newSections[index];
    newSections[index] = newSections[index + 1];
    newSections[index + 1] = temp;
    setSections(newSections);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-display font-bold text-navy">Content & CMS</h2>
          <p className="text-sm text-text-muted">Manage homepage structure, banners, and layout.</p>
        </div>
        <Button>Save Layout</Button>
      </div>

      <div className="bg-white rounded-xl border border-neutral-200 shadow-sm overflow-hidden p-6">
        <h3 className="font-bold text-navy mb-4">Homepage Sections</h3>
        <div className="space-y-2">
          {sections.map((section, idx) => (
            <div key={section.id} className={`flex items-center justify-between p-3 border rounded-lg ${section.isVisible ? 'bg-white border-neutral-200' : 'bg-neutral-50 border-neutral-100 text-text-muted'}`}>
              <div className="flex items-center gap-4">
                <GripVertical className="text-neutral-400 cursor-move h-5 w-5" />
                <div>
                  <span className="font-bold block">{section.title}</span>
                  <span className="text-xs text-text-muted">{section.type}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={() => moveUp(idx)} disabled={idx === 0}><MoveUp className="h-4 w-4" /></Button>
                <Button variant="ghost" size="sm" onClick={() => moveDown(idx)} disabled={idx === sections.length - 1}><MoveDown className="h-4 w-4" /></Button>
                <div className="w-px h-6 bg-neutral-200 mx-1"></div>
                <Button variant="ghost" size="sm" onClick={() => toggleVisibility(section.id)}>
                  {section.isVisible ? <Eye className="h-4 w-4 text-dpc-blue" /> : <EyeOff className="h-4 w-4" />}
                </Button>
                <Button variant="ghost" size="sm"><Edit className="h-4 w-4" /></Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

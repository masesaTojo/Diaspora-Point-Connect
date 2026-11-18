import React, { useEffect, useState, useMemo } from 'react';
import {
  MessageSquare,
  Search,
  Clock,
  CheckCircle2,
  AlertCircle,
  Mail,
  Phone,
  Globe2,
  Package,
  Send,
} from 'lucide-react';
import { SupportTicket, SupportTicketStatus } from '@/src/types';
import { db } from '@/src/lib/firebase';
import { collection, doc, onSnapshot, orderBy, query, updateDoc } from 'firebase/firestore';
import { buildFirestoreErrorInfo, OperationType, stripUndefined } from '@/src/lib/firestoreErrors';
import { useAuth } from '@/src/contexts/AuthContext';
import { Button } from '@/src/components/ui/Button';

const STATUS_STYLES: Record<SupportTicketStatus, string> = {
  OPEN: 'bg-amber-100 text-amber-800 border-amber-200',
  IN_PROGRESS: 'bg-blue-100 text-blue-800 border-blue-200',
  RESOLVED: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  CLOSED: 'bg-neutral-100 text-neutral-700 border-neutral-200',
};

export default function SupportDesk() {
  const { currentUser, logAction } = useAuth();
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | SupportTicketStatus>('ALL');
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [resolutionDraft, setResolutionDraft] = useState('');
  const [nextStatus, setNextStatus] = useState<SupportTicketStatus>('IN_PROGRESS');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const q = query(collection(db, 'supportTickets'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const list = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as SupportTicket));
        setTickets(list);
        setLoading(false);
        setErrorMsg(null);
      },
      (err) => {
        console.error(
          'Support tickets stream error:',
          JSON.stringify(buildFirestoreErrorInfo(err, OperationType.LIST, 'supportTickets'))
        );
        setErrorMsg('Unable to load support tickets. Ensure Phase 4 Firestore security rules are deployed.');
        setLoading(false);
      }
    );
    return () => unsubscribe();
  }, []);

  const filteredTickets = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return tickets.filter((t) => {
      const matchesStatus = statusFilter === 'ALL' || t.status === statusFilter;
      const matchesSearch =
        !term ||
        t.id.toLowerCase().includes(term) ||
        t.name.toLowerCase().includes(term) ||
        t.email.toLowerCase().includes(term) ||
        (t.orderId || '').toLowerCase().includes(term) ||
        t.subject.toLowerCase().includes(term);
      return matchesStatus && matchesSearch;
    });
  }, [tickets, searchTerm, statusFilter]);

  const selectedTicket = useMemo(
    () => tickets.find((t) => t.id === selectedTicketId) || filteredTickets[0] || null,
    [tickets, selectedTicketId, filteredTickets]
  );

  useEffect(() => {
    if (selectedTicket) {
      setResolutionDraft(selectedTicket.resolutionNote || '');
      setNextStatus(selectedTicket.status === 'OPEN' ? 'IN_PROGRESS' : selectedTicket.status);
    }
  }, [selectedTicket?.id]);

  const handleUpdateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket) return;

    setSaving(true);
    setErrorMsg(null);
    const nowIso = new Date().toISOString();
    const trimmedNote = resolutionDraft.trim();

    try {
      const updatePayload = stripUndefined({
        status: nextStatus,
        resolutionNote: trimmedNote || undefined,
        assignedToEmail: currentUser?.email || undefined,
        updatedAt: nowIso,
      });

      await updateDoc(doc(db, 'supportTickets', selectedTicket.id), updatePayload);
      logAction(
        'UPDATE_TICKET',
        'SupportTicket',
        selectedTicket.id,
        selectedTicket.status,
        `${nextStatus}${trimmedNote ? `: ${trimmedNote.slice(0, 80)}` : ''}`
      );
    } catch (err) {
      console.error(
        'Support ticket update error:',
        JSON.stringify(buildFirestoreErrorInfo(err, OperationType.UPDATE, `supportTickets/${selectedTicket.id}`))
      );
      setErrorMsg((err as Error)?.message || 'Failed to update support ticket.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-display font-bold text-navy">Support Desk</h2>
          <p className="text-sm text-text-muted">
            Respond to diaspora customer inquiries, delivery reschedules, and PesaPal assistance requests.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
            <input
              type="text"
              placeholder="Search ticket ID, email, order..."
              className="w-full pl-9 pr-4 py-2 border border-neutral-300 rounded-md text-sm focus:ring-dpc-blue focus:border-dpc-blue"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select
            className="px-3 py-2 border border-neutral-300 rounded-md text-sm bg-white"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as 'ALL' | SupportTicketStatus)}
          >
            <option value="ALL">All Statuses ({tickets.length})</option>
            <option value="OPEN">OPEN ({tickets.filter((t) => t.status === 'OPEN').length})</option>
            <option value="IN_PROGRESS">IN PROGRESS ({tickets.filter((t) => t.status === 'IN_PROGRESS').length})</option>
            <option value="RESOLVED">RESOLVED ({tickets.filter((t) => t.status === 'RESOLVED').length})</option>
            <option value="CLOSED">CLOSED ({tickets.filter((t) => t.status === 'CLOSED').length})</option>
          </select>
        </div>
      </div>

      {errorMsg && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl flex items-center gap-3 text-sm">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Ticket Queue */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-neutral-200 shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-12 text-center text-sm text-text-muted">Loading support queue...</div>
          ) : filteredTickets.length === 0 ? (
            <div className="p-12 text-center text-text-muted space-y-2">
              <MessageSquare className="w-10 h-10 text-neutral-300 mx-auto" />
              <p className="text-sm font-medium">No support tickets match your current filter.</p>
            </div>
          ) : (
            <div className="divide-y divide-neutral-100">
              {filteredTickets.map((ticket) => {
                const isSelected = selectedTicket?.id === ticket.id;
                return (
                  <button
                    key={ticket.id}
                    type="button"
                    onClick={() => setSelectedTicketId(ticket.id)}
                    className={`w-full text-left p-5 transition-colors hover:bg-blue-50/40 ${
                      isSelected ? 'bg-blue-50/80 border-l-4 border-dpc-blue' : ''
                    }`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-navy">{ticket.id}</span>
                        <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold border ${STATUS_STYLES[ticket.status]}`}>
                          {ticket.status.replace('_', ' ')}
                        </span>
                        {ticket.orderId && (
                          <span className="px-2 py-0.5 rounded bg-neutral-100 text-navy font-mono text-[11px]">
                            Order #{ticket.orderId}
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-text-muted">
                        {ticket.createdAt ? new Date(ticket.createdAt).toLocaleString() : ''}
                      </span>
                    </div>
                    <h4 className="font-bold text-navy text-sm mb-1">{ticket.subject}</h4>
                    <p className="text-xs text-text-muted line-clamp-2 mb-2">{ticket.message}</p>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-text-muted">
                      <span className="font-medium text-navy">{ticket.name}</span>
                      <span>• {ticket.email}</span>
                      {ticket.country && <span>• {ticket.country}</span>}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Ticket Detail & Response Panel */}
        <div className="lg:col-span-1">
          {selectedTicket ? (
            <div className="bg-white rounded-xl border border-neutral-200 shadow-sm p-6 sticky top-24 space-y-5">
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="font-mono text-xs font-bold text-dpc-blue">{selectedTicket.id}</span>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${STATUS_STYLES[selectedTicket.status]}`}>
                    {selectedTicket.status.replace('_', ' ')}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-navy">{selectedTicket.subject}</h3>
                <p className="text-xs text-text-muted mt-1 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  Submitted {new Date(selectedTicket.createdAt).toLocaleString()}
                </p>
              </div>

              <div className="p-4 rounded-xl bg-neutral-50 border border-neutral-200 space-y-2 text-xs">
                <div className="font-bold text-navy text-sm">{selectedTicket.name}</div>
                <div className="flex items-center gap-2 text-text-muted">
                  <Mail className="w-3.5 h-3.5 text-dpc-blue" /> {selectedTicket.email}
                </div>
                {selectedTicket.phone && (
                  <div className="flex items-center gap-2 text-text-muted">
                    <Phone className="w-3.5 h-3.5 text-dpc-blue" /> {selectedTicket.phone}
                  </div>
                )}
                {selectedTicket.country && (
                  <div className="flex items-center gap-2 text-text-muted">
                    <Globe2 className="w-3.5 h-3.5 text-dpc-blue" /> {selectedTicket.country}
                  </div>
                )}
                {selectedTicket.orderId && (
                  <div className="flex items-center gap-2 text-navy font-semibold">
                    <Package className="w-3.5 h-3.5 text-dpc-blue" /> Order Ref: {selectedTicket.orderId}
                  </div>
                )}
              </div>

              <div>
                <h4 className="text-xs font-bold uppercase text-text-muted mb-1.5">Customer Message</h4>
                <div className="p-3.5 rounded-xl border border-neutral-200 bg-white text-sm text-navy whitespace-pre-wrap leading-relaxed">
                  {selectedTicket.message}
                </div>
              </div>

              <form onSubmit={handleUpdateTicket} className="space-y-4 pt-3 border-t border-neutral-200">
                <div>
                  <label className="block text-xs font-bold uppercase text-navy mb-1">Ticket Status</label>
                  <select
                    value={nextStatus}
                    onChange={(e) => setNextStatus(e.target.value as SupportTicketStatus)}
                    className="w-full p-2.5 border border-neutral-300 rounded-lg text-sm bg-white"
                  >
                    <option value="OPEN">OPEN</option>
                    <option value="IN_PROGRESS">IN PROGRESS</option>
                    <option value="RESOLVED">RESOLVED</option>
                    <option value="CLOSED">CLOSED</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-navy mb-1">
                    Concierge Reply / Resolution Note
                  </label>
                  <textarea
                    rows={4}
                    value={resolutionDraft}
                    onChange={(e) => setResolutionDraft(e.target.value)}
                    placeholder="Enter response notes visible to the customer in Account -> Support Tickets..."
                    className="w-full p-3 border border-neutral-300 rounded-lg text-sm"
                  />
                </div>

                <Button type="submit" disabled={saving} className="w-full flex items-center justify-center gap-2">
                  <Send className="w-4 h-4" />
                  {saving ? 'Saving Update...' : 'Save Ticket Update'}
                </Button>

                {selectedTicket.assignedToEmail && (
                  <p className="text-[11px] text-text-muted flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    Last handled by {selectedTicket.assignedToEmail}
                  </p>
                )}
              </form>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-neutral-200 shadow-sm p-10 text-center text-text-muted">
              <MessageSquare className="w-10 h-10 text-neutral-300 mx-auto mb-3" />
              <p className="text-sm">Select a support ticket to inspect details and respond.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

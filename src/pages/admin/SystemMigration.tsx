import React, { useState, useEffect } from 'react';
import { Database, ShieldCheck, ShieldAlert, AlertCircle, CheckCircle2, Loader2, Play } from 'lucide-react';
import { Button } from '@/src/components/ui/Button';
import { seedDatabase, isDatabaseEmpty } from '@/src/lib/firebaseSeeder';
import { useAuth } from '@/src/contexts/AuthContext';

export default function SystemMigration() {
  const { hasRole, loading } = useAuth();
  const isSuperAdmin = hasRole('SUPER_ADMIN');
  const [status, setStatus] = useState<'IDLE' | 'CHECKING' | 'EMPTY' | 'NOT_EMPTY' | 'SEEDING' | 'SUCCESS' | 'ERROR'>('IDLE');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && isSuperAdmin) {
      checkStatus();
    }
  }, [loading, isSuperAdmin]);

  if (loading) {
    return (
      <div className="p-12 flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-dpc-blue animate-spin mr-2" />
        <span className="text-sm font-semibold text-navy">Verifying administrator permissions...</span>
      </div>
    );
  }

  if (!isSuperAdmin) {
    return (
      <div className="max-w-xl mx-auto p-8 bg-white rounded-2xl border border-red-200 text-center space-y-3">
        <ShieldAlert className="w-10 h-10 text-red-600 mx-auto" />
        <h2 className="text-xl font-bold text-navy">Access Denied</h2>
        <p className="text-sm text-text-muted">Only a verified SUPER_ADMIN may access database migration and seeding tools.</p>
      </div>
    );
  }

  const checkStatus = async () => {
    setStatus('CHECKING');
    try {
      const empty = await isDatabaseEmpty();
      setStatus(empty ? 'EMPTY' : 'NOT_EMPTY');
    } catch (err) {
      console.error(err);
      setStatus('ERROR');
      setError('Failed to connect to Firestore. Ensure you have provisioned the database.');
    }
  };

  const handleSeed = async () => {
    if (!isSuperAdmin) return;
    setError(null);
    setStatus('SEEDING');
    try {
      await seedDatabase();
      setStatus('SUCCESS');
    } catch (err) {
      console.error(err);
      setStatus('ERROR');
      setError(err instanceof Error ? err.message : 'Unknown error during seeding');
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="bg-white rounded-3xl p-8 border border-neutral-200 shadow-sm">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 bg-dpc-blue/10 text-dpc-blue rounded-2xl flex items-center justify-center">
            <Database className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-navy">Firebase Data Migration</h1>
            <p className="text-sm text-text-muted">Initialize or sync your persistent Firestore database with sample categories and products.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="p-6 rounded-2xl bg-neutral-50 border border-neutral-200">
            <div className="text-[10px] font-bold text-text-muted uppercase tracking-widest mb-1">Database Status</div>
            <div className="flex items-center gap-2">
              {status === 'CHECKING' && <Loader2 className="w-4 h-4 text-dpc-blue animate-spin" />}
              {status === 'EMPTY' && <span className="text-amber-600 font-bold flex items-center gap-1.5"><AlertCircle className="w-4 h-4" /> Ready to Seed</span>}
              {(status === 'NOT_EMPTY' || status === 'SUCCESS') && <span className="text-emerald-600 font-bold flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4" /> Data Present</span>}
              {status === 'SEEDING' && <span className="text-dpc-blue font-bold flex items-center gap-1.5"><Loader2 className="w-4 h-4 animate-spin" /> Syncing...</span>}
              {status === 'ERROR' && <span className="text-red-600 font-bold">Connection Error</span>}
            </div>
          </div>
          
          <div className="p-6 rounded-2xl bg-neutral-50 border border-neutral-200">
            <div className="text-[10px] font-bold text-text-muted uppercase tracking-widest mb-1">Environment</div>
            <div className="font-bold text-navy flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-dpc-blue" /> Production Ready
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-neutral-50 border border-neutral-200">
            <div className="text-[10px] font-bold text-text-muted uppercase tracking-widest mb-1">Connected Service</div>
            <div className="font-bold text-navy">Google Cloud Firestore</div>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl mb-6 text-sm flex items-start gap-3">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <p>{error}</p>
          </div>
        )}

        <div className="bg-blue-50 border border-blue-100 p-6 rounded-2xl space-y-4">
          <h3 className="font-bold text-navy flex items-center gap-2">
            <Play className="w-4 h-4" /> Migration Steps
          </h3>
          <ul className="space-y-3 text-sm text-navy/80">
            <li className="flex items-start gap-3">
              <span className="w-5 h-5 rounded-full bg-white text-dpc-blue flex items-center justify-center text-[10px] font-bold shrink-0 shadow-sm border border-blue-200">1</span>
              <span>Verify that Firebase has been provisioned in the AI Studio sidebar.</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="w-5 h-5 rounded-full bg-white text-dpc-blue flex items-center justify-center text-[10px] font-bold shrink-0 shadow-sm border border-blue-200">2</span>
              <span>Click "Sync Sample Catalog (80+ Products)" below to push all 8 categories, 10+ products per category, delivery zones, and CMS data to Firestore.</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="w-5 h-5 rounded-full bg-white text-dpc-blue flex items-center justify-center text-[10px] font-bold shrink-0 shadow-sm border border-blue-200">3</span>
              <span>Once complete, all customers will see the synced Firestore catalog in real time.</span>
            </li>
          </ul>

          <div className="pt-4">
            <Button 
              onClick={handleSeed}
              disabled={status === 'SEEDING' || status === 'CHECKING'}
              className="bg-navy hover:bg-navy-light h-12 px-8 font-bold gap-2"
            >
              {status === 'SEEDING' ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Seeding Database...
                </>
              ) : (
                <>
                  <Database className="w-4 h-4" />
                  Sync Sample Catalog (80+ Products)
                </>
              )}
            </Button>
            
            {status === 'SUCCESS' && (
              <p className="text-emerald-600 text-sm font-bold mt-3 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" /> Sync successful! All 8 categories and sample products are now stored in Firestore.
              </p>
            )}
          </div>
        </div>
      </div>
      
      <div className="bg-amber-50 border border-amber-200 p-8 rounded-3xl">
        <h3 className="font-bold text-amber-900 mb-2 flex items-center gap-2">
          <AlertCircle className="w-5 h-5" /> Warning: Data Overwrite
        </h3>
        <p className="text-sm text-amber-800 leading-relaxed">
          The initialization process will attempt to set documents with fixed IDs. If you have already modified data in Firestore, seeding might overwrite specific fields. Use this only for initial setup.
        </p>
      </div>
    </div>
  );
}

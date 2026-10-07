'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function CreateRFQ() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '',
    bidStartAt: '',
    bidCloseAt: '',
    forcedCloseAt: '',
    pickupDate: '',
    triggerWindowMinutes: 10,
    extensionDurationMinutes: 5,
    triggerType: 'ANY_BID',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (new Date(formData.forcedCloseAt) <= new Date(formData.bidCloseAt)) {
      alert('Error: Forced Close Time must be strictly later than Bid Close Time');
      return;
    }

    try {
      const res = await fetch('http://localhost:3001/api/rfq', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        router.push('/');
      } else {
        alert('Failed to create RFQ');
      }
    } catch (err) {
      console.error(err);
      alert('Error connecting to backend');
    }
  };

  return (
    <main className="p-10 max-w-3xl mx-auto">
      <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 mb-8 text-center">Create New RFQ</h1>
      <form onSubmit={handleSubmit} className="bg-white/80 backdrop-blur-md p-8 rounded-2xl shadow-xl border border-white/50 relative overflow-hidden">
        {/* Subtle decorative element */}
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500"></div>
        
        <div className="mb-6">
          <label className="block text-slate-700 font-semibold mb-2">RFQ Name / Reference ID</label>
          <input required type="text" className="w-full bg-slate-50 border border-slate-200 text-slate-900 p-3 rounded-xl hover:bg-white focus:bg-white transition-all placeholder-slate-400" placeholder="e.g. Q3 Logistics Contract"
            value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <label className="block text-slate-700 font-semibold mb-2">Bid Start Date & Time</label>
            <input required type="datetime-local" className="w-full bg-slate-50 border border-slate-200 text-slate-900 p-3 rounded-xl hover:bg-white focus:bg-white transition-all" 
              value={formData.bidStartAt} onChange={(e) => setFormData({...formData, bidStartAt: e.target.value})} />
          </div>
          <div>
            <label className="block text-slate-700 font-semibold mb-2">Bid Close Date & Time</label>
            <input required type="datetime-local" className="w-full bg-slate-50 border border-slate-200 text-slate-900 p-3 rounded-xl hover:bg-white focus:bg-white transition-all" 
              value={formData.bidCloseAt} onChange={(e) => setFormData({...formData, bidCloseAt: e.target.value})} />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="relative group">
            <label className="block text-rose-600 font-bold mb-2 flex items-center gap-1">
              Forced Close Time
              <span className="text-rose-400" title="Hard limit for the auction even with extensions">ⓘ</span>
            </label>
            <input required type="datetime-local" className="w-full bg-rose-50 border border-rose-200 text-rose-900 p-3 rounded-xl hover:bg-white focus:bg-white focus:border-rose-400 focus:ring-rose-200 transition-all" 
              value={formData.forcedCloseAt} onChange={(e) => setFormData({...formData, forcedCloseAt: e.target.value})} />
            <p className="text-xs text-rose-500 mt-2 font-medium">Must be later than Bid Close Time</p>
          </div>
          <div>
            <label className="block text-slate-700 font-semibold mb-2">Pickup / Service Date</label>
            <input required type="datetime-local" className="w-full bg-slate-50 border border-slate-200 text-slate-900 p-3 rounded-xl hover:bg-white focus:bg-white transition-all" 
              value={formData.pickupDate} onChange={(e) => setFormData({...formData, pickupDate: e.target.value})} />
          </div>
        </div>

        <div className="bg-slate-50 rounded-xl p-6 border border-slate-100 mb-8">
          <h3 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
            </svg>
            Auction Configurations
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-slate-700 font-semibold mb-2">Trigger Window (Mins)</label>
              <input required type="number" min="1" className="w-full bg-white border border-slate-200 text-slate-900 p-3 rounded-xl transition-all" 
                value={formData.triggerWindowMinutes} onChange={(e) => setFormData({...formData, triggerWindowMinutes: Number(e.target.value)})} />
            </div>
            <div>
              <label className="block text-slate-700 font-semibold mb-2">Extension Duration (Mins)</label>
              <input required type="number" min="1" className="w-full bg-white border border-slate-200 text-slate-900 p-3 rounded-xl transition-all" 
                value={formData.extensionDurationMinutes} onChange={(e) => setFormData({...formData, extensionDurationMinutes: Number(e.target.value)})} />
            </div>
          </div>

          <div>
            <label className="block text-slate-700 font-semibold mb-2">Extension Trigger Rule</label>
            <select className="w-full bg-white border border-slate-200 text-slate-900 p-3 rounded-xl transition-all cursor-pointer" value={formData.triggerType} onChange={(e) => setFormData({...formData, triggerType: e.target.value})}>
              <option value="ANY_BID">Any Bid Received in Last X Minutes</option>
              <option value="ANY_RANK_CHANGE">Any Supplier Rank Change in Last X Minutes</option>
              <option value="L1_RANK_CHANGE">Lowest Bidder (L1) Rank Change in Last X Minutes</option>
            </select>
          </div>
        </div>

        <button type="submit" className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white p-4 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-0.5">
          Publish RFQ
        </button>
      </form>
    </main>
  );
}

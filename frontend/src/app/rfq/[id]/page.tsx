'use client';
import { useEffect, useState, use } from 'react';
import { format } from 'date-fns';

export default function RFQDetails({ params }: { params: Promise<{ id: string }> }) {
  const unwrappedParams = use(params);
  const id = unwrappedParams.id;
  
  const [rfq, setRfq] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Bid form state
  const [bidForm, setBidForm] = useState({
    supplierName: '',
    freightCharges: 0,
    originCharges: 0,
    destinationCharges: 0,
    transitTime: '',
    validityDate: '',
  });

  const fetchRfq = () => {
    fetch(`http://localhost:3001/api/rfq/${id}`)
      .then((res) => res.json())
      .then((data) => {
        setRfq(data);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchRfq();
    // In a real app, we would use WebSockets here for real-time auction updates.
    // We will poll every 5 seconds for simplicity in this demo.
    const interval = setInterval(fetchRfq, 5000);
    return () => clearInterval(interval);
  }, [id]);

  const submitBid = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`http://localhost:3001/api/rfq/${id}/bids`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bidForm),
      });
      
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || 'Failed to submit bid');
      } else {
        alert('Bid submitted successfully!');
        fetchRfq(); // Refresh data immediately
        setBidForm({ ...bidForm, freightCharges: 0, originCharges: 0, destinationCharges: 0 }); // reset prices
      }
    } catch (err) {
      alert('Error submitting bid');
    }
  };

  if (loading) return <div className="p-10">Loading RFQ Details...</div>;
  if (!rfq || rfq.error) return <div className="p-10 text-red-500">RFQ Not Found</div>;

  const totalBidAmount = Number(bidForm.freightCharges) + Number(bidForm.originCharges) + Number(bidForm.destinationCharges);

  return (
    <main className="p-10 max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
      
      <div className="lg:col-span-2 space-y-8">
        {/* RFQ Details */}
        <section className="bg-white/80 backdrop-blur-md p-8 rounded-2xl shadow-xl border border-white/50 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-400 to-indigo-500"></div>
          <div className="flex justify-between items-start mb-4">
            <div>
              <h1 className="text-2xl font-bold">{rfq.name}</h1>
              <p className="text-gray-500 text-sm">ID: {rfq.id}</p>
            </div>
            <span className={`px-3 py-1 rounded-full text-sm font-bold ${
              rfq.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 
              rfq.status === 'FORCE_CLOSED' ? 'bg-red-100 text-red-800' : 'bg-gray-200 text-gray-800'
            }`}>
              {rfq.status}
            </span>
          </div>
          
          <div className="grid grid-cols-2 gap-4 text-sm mt-4">
            <div><strong>Start Time:</strong> {format(new Date(rfq.bidStartAt), 'PPp')}</div>
            <div className="text-blue-600 font-bold"><strong>Current Close Time:</strong> {format(new Date(rfq.bidCloseAt), 'PPp')}</div>
            <div className="text-red-500"><strong>Forced Close Time:</strong> {format(new Date(rfq.forcedCloseAt), 'PPp')}</div>
            <div><strong>Pickup Date:</strong> {format(new Date(rfq.pickupDate), 'PPp')}</div>
          </div>
          
          <div className="mt-6 p-4 bg-slate-50 rounded-xl border border-slate-100 text-sm text-slate-700 shadow-inner">
            <strong>Auction Rules:</strong> Extend by <strong className="text-indigo-600">{rfq.extensionDurationMinutes} mins</strong> if condition 
            <strong className="text-blue-600 bg-blue-50 px-2 py-0.5 rounded ml-1"> {rfq.triggerType} </strong> 
            is met within the last <strong className="text-rose-500">{rfq.triggerWindowMinutes} mins</strong>.
          </div>
        </section>

        {/* Bids Listing */}
        <section className="bg-white/80 backdrop-blur-md p-8 rounded-2xl shadow-xl border border-white/50">
          <h2 className="text-2xl font-bold mb-6 text-slate-800">Supplier Bids (Live Ranking)</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm border-collapse">
              <thead>
                <tr className="bg-slate-50/80 text-slate-600 uppercase tracking-wider text-xs border-b border-slate-200">
                  <th className="p-4 font-semibold rounded-tl-xl">Rank</th>
                  <th className="p-4 font-semibold">Supplier Name</th>
                  <th className="p-4 font-semibold">Total Amount</th>
                  <th className="p-4 font-semibold">Freight / Origin / Dest</th>
                  <th className="p-4 font-semibold">Transit Time</th>
                  <th className="p-4 font-semibold rounded-tr-xl">Submitted At</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rfq.bids.length === 0 ? (
                  <tr><td colSpan={6} className="p-6 text-center text-slate-500 italic">No bids yet</td></tr>
                ) : (
                  rfq.bids.map((bid: any) => (
                    <tr key={bid.id} className="hover:bg-blue-50/50 transition-colors">
                      <td className="p-4 font-extrabold text-indigo-600">{bid.rank}</td>
                      <td className="p-4 font-medium text-slate-800">{bid.supplierName}</td>
                      <td className="p-4 font-bold text-emerald-600">${bid.totalAmount.toFixed(2)}</td>
                      <td className="p-4 text-xs text-slate-500">
                        ${bid.freightCharges} / ${bid.originCharges} / ${bid.destinationCharges}
                      </td>
                      <td className="p-4 text-slate-600">{bid.transitTime}</td>
                      <td className="p-4 text-slate-600">{format(new Date(bid.createdAt), 'p')}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* Activity Log */}
        <section className="bg-white/80 backdrop-blur-md p-8 rounded-2xl shadow-xl border border-white/50">
          <h2 className="text-2xl font-bold mb-6 text-slate-800">Activity Log</h2>
          <div className="max-h-80 overflow-y-auto space-y-3 pr-2 scrollbar-thin scrollbar-thumb-slate-200">
            {rfq.activityLogs.length === 0 ? (
              <p className="text-slate-500 italic">No activity yet.</p>
            ) : (
              rfq.activityLogs.map((log: any) => (
                <div key={log.id} className={`p-4 rounded-xl border-l-4 shadow-sm ${log.activityType === 'TIME_EXTENSION' ? 'border-amber-400 bg-amber-50/50' : 'border-indigo-400 bg-indigo-50/50'}`}>
                  <span className="font-bold text-slate-700 opacity-70 text-xs tracking-wider uppercase mb-1 block">
                    {format(new Date(log.createdAt), 'MMM d, HH:mm:ss')}
                  </span>
                  <p className="text-slate-800 font-medium">{log.description}</p>
                </div>
              ))
            )}
          </div>
        </section>
      </div>

      {/* Quote Submission Form */}
      <div>
        <section className="bg-gradient-to-b from-blue-50 to-indigo-50/30 p-8 rounded-2xl shadow-xl border border-blue-100 sticky top-10">
          <h2 className="text-2xl font-extrabold mb-6 text-indigo-900 tracking-tight">Submit a Quote</h2>
          
          {rfq.status !== 'ACTIVE' ? (
            <div className="p-4 bg-rose-100 text-rose-800 rounded-xl font-bold text-center border border-rose-200">
              Auction is currently {rfq.status}
            </div>
          ) : (
            <form onSubmit={submitBid} className="space-y-5">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Carrier / Supplier Name</label>
                <input required type="text" className="w-full bg-white border border-slate-200 text-slate-900 p-3 rounded-xl focus:ring-2 focus:ring-indigo-500 transition-all" 
                  value={bidForm.supplierName} onChange={e => setBidForm({...bidForm, supplierName: e.target.value})} />
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Freight ($)</label>
                  <input required type="number" min="0" step="0.01" className="w-full bg-white border border-slate-200 text-slate-900 p-3 rounded-xl focus:ring-2 focus:ring-indigo-500 transition-all" 
                    value={bidForm.freightCharges} onChange={e => setBidForm({...bidForm, freightCharges: Number(e.target.value)})} />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Origin ($)</label>
                  <input required type="number" min="0" step="0.01" className="w-full bg-white border border-slate-200 text-slate-900 p-3 rounded-xl focus:ring-2 focus:ring-indigo-500 transition-all" 
                    value={bidForm.originCharges} onChange={e => setBidForm({...bidForm, originCharges: Number(e.target.value)})} />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Destination Charges ($)</label>
                <input required type="number" min="0" step="0.01" className="w-full bg-white border border-slate-200 text-slate-900 p-3 rounded-xl focus:ring-2 focus:ring-indigo-500 transition-all" 
                  value={bidForm.destinationCharges} onChange={e => setBidForm({...bidForm, destinationCharges: Number(e.target.value)})} />
              </div>

              <div className="p-4 bg-white border border-indigo-100 rounded-xl font-bold text-lg text-center shadow-sm">
                Total Price: <span className="text-emerald-600 ml-2">${totalBidAmount.toFixed(2)}</span>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Transit Time (e.g. "5 days")</label>
                <input required type="text" className="w-full bg-white border border-slate-200 text-slate-900 p-3 rounded-xl focus:ring-2 focus:ring-indigo-500 transition-all" 
                  value={bidForm.transitTime} onChange={e => setBidForm({...bidForm, transitTime: e.target.value})} />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Validity of Quote</label>
                <input required type="datetime-local" className="w-full bg-white border border-slate-200 text-slate-900 p-3 rounded-xl focus:ring-2 focus:ring-indigo-500 transition-all" 
                  value={bidForm.validityDate} onChange={e => setBidForm({...bidForm, validityDate: e.target.value})} />
              </div>

              <button type="submit" className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white p-4 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-0.5 mt-2">
                Place Bid
              </button>
            </form>
          )}
        </section>
      </div>

    </main>
  );
}

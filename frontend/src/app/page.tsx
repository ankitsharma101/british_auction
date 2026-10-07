'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { format } from 'date-fns';

export default function Home() {
  const [rfqs, setRfqs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('http://localhost:3001/api/rfq')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setRfqs(data);
        } else {
          console.error('Failed to fetch RFQs:', data);
          setRfqs([]);
        }
        setLoading(false);
      });
  }, []);

  if (loading) return <div className="p-10">Loading RFQs...</div>;

  return (
    <main className="p-10 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 mb-2">British Auctions</h1>
          <p className="text-slate-500">Manage and participate in reverse auctions (RFQs)</p>
        </div>
        <Link href="/rfq/new" className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-6 py-3 rounded-lg shadow-lg hover:shadow-xl transition-all font-semibold flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
          </svg>
          Create New RFQ
        </Link>
      </div>

      <div className="overflow-x-auto bg-white/80 backdrop-blur-md rounded-2xl shadow-xl border border-white/50">
        <table className="min-w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/80 text-slate-600 text-sm uppercase tracking-wider border-b border-slate-200">
              <th className="p-5 font-semibold rounded-tl-2xl">RFQ Name / ID</th>
              <th className="p-5 font-semibold">Current Lowest Bid</th>
              <th className="p-5 font-semibold">Current Bid Close Time</th>
              <th className="p-5 font-semibold">Forced Close Time</th>
              <th className="p-5 font-semibold">Status</th>
              <th className="p-5 font-semibold rounded-tr-2xl">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rfqs.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-4 text-center text-gray-500">
                  No RFQs available.
                </td>
              </tr>
            ) : (
              rfqs.map((rfq) => (
                <tr key={rfq.id} className="hover:bg-blue-50/50 transition-colors group">
                  <td className="p-5">
                    <p className="font-semibold text-slate-800">{rfq.name}</p>
                    <p className="text-xs text-slate-400 font-mono mt-1">{rfq.id.split('-')[0]}</p>
                  </td>
                  <td className="p-5">
                    <span className="font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100">
                      {rfq.currentLowestBid ? `$${rfq.currentLowestBid.toFixed(2)}` : 'No Bids'}
                    </span>
                  </td>
                  <td className="p-5 text-slate-600">{format(new Date(rfq.bidCloseAt), 'MMM d, yyyy h:mm a')}</td>
                  <td className="p-5 text-rose-500 font-medium">{format(new Date(rfq.forcedCloseAt), 'MMM d, yyyy h:mm a')}</td>
                  <td className="p-5">
                    <span className={`px-3 py-1 text-xs rounded-full font-bold shadow-sm ${
                      rfq.status === 'ACTIVE' ? 'bg-gradient-to-r from-emerald-400 to-emerald-500 text-white' : 
                      rfq.status === 'FORCE_CLOSED' ? 'bg-gradient-to-r from-rose-400 to-rose-500 text-white' : 
                      rfq.status === 'CLOSED' ? 'bg-gradient-to-r from-indigo-400 to-indigo-500 text-white' :
                      'bg-slate-200 text-slate-700'
                    }`}>
                      {rfq.status}
                    </span>
                  </td>
                  <td className="p-5">
                    <Link href={`/rfq/${rfq.id}`} className="text-indigo-600 font-medium hover:text-indigo-800 flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                      View Details
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                      </svg>
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}

import { useState, useEffect } from 'react';
import useStore from '../store/useStore';
import { convoyApi } from '../services/api';

function ConvoysModal({ onClose }) {
  const { convoys, fetchConvoys, changePassword } = useStore();
  const [activeTab, setActiveTab] = useState('convoys');
  const [newName, setNewName] = useState('');
  const [error, setError] = useState('');
  
  // Password change state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordMsg, setPasswordMsg] = useState({ type: '', text: '' });

  // Auto-detect fleet from name
  const detectFleet = (name) => {
    const upper = name.toUpperCase();
    if (upper.startsWith('SGC')) return 'SGC';
    if (upper.startsWith('KBTL')) return 'KBTL';
    if (upper.startsWith('KS')) return 'KS';
    if (upper.startsWith('GT')) return 'GT';
    if (upper.startsWith('TE')) return 'TE';
    return null;
  };

  const handleAdd = async () => {
    const name = newName.trim();
    if (!name) {
      setError('Enter convoy name');
      return;
    }
    const fleet = detectFleet(name);
    if (!fleet) {
      setError('Name must start with SGC, KBTL, TE, KS, or GT');
      return;
    }
    try {
      await convoyApi.create({ name, fleet });
      setNewName('');
      setError('');
      fetchConvoys();
    } catch (err) {
      if (err.response?.data?.message?.includes('duplicate') || err.response?.data?.message?.includes('E11000')) {
        setError(`"${name}" already exists`);
      } else {
        setError(err.response?.data?.message || 'Failed to add');
      }
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleAdd();
  };

  const handleDelete = async (id) => {
    try {
      await convoyApi.delete(id);
      fetchConvoys();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete');
    }
  };

  const handleChangePassword = () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordMsg({ type: 'error', text: 'All fields are required' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordMsg({ type: 'error', text: 'New passwords do not match' });
      return;
    }
    if (newPassword.length < 4) {
      setPasswordMsg({ type: 'error', text: 'Password must be at least 4 characters' });
      return;
    }
    
    const success = changePassword(currentPassword, newPassword);
    if (success) {
      setPasswordMsg({ type: 'success', text: 'Password changed successfully' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } else {
      setPasswordMsg({ type: 'error', text: 'Current password is incorrect' });
    }
  };

  // Group convoys by fleet and sort by number
  const byFleet = { SGC: [], KBTL: [], TE: [], KS: [], GT: [] };
  convoys.forEach(c => {
    if (byFleet[c.fleet]) byFleet[c.fleet].push(c);
  });
  // Sort each fleet by the number in the name
  Object.keys(byFleet).forEach(fleet => {
    byFleet[fleet].sort((a, b) => {
      const numA = parseInt(a.name.split('-')[1]) || 0;
      const numB = parseInt(b.name.split('-')[1]) || 0;
      return numA - numB;
    });
  });

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-lg w-[500px] max-h-[80vh] shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="bg-slate-800 text-white px-5 py-3.5 flex justify-between items-center">
          <span className="font-semibold text-sm uppercase tracking-wide">Configuration</span>
          <button onClick={onClose} className="text-xl opacity-70 hover:opacity-100">×</button>
        </div>

        {/* Tabs */}
        <div className="flex border-b bg-slate-50">
          <button
            onClick={() => { setActiveTab('convoys'); setPasswordMsg({ type: '', text: '' }); }}
            className={`flex-1 py-2.5 text-xs font-semibold uppercase tracking-wide transition ${
              activeTab === 'convoys' 
                ? 'bg-white text-slate-800 border-b-2 border-slate-800' 
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            🚚 Convoys
          </button>
          <button
            onClick={() => { setActiveTab('password'); setError(''); }}
            className={`flex-1 py-2.5 text-xs font-semibold uppercase tracking-wide transition ${
              activeTab === 'password' 
                ? 'bg-white text-slate-800 border-b-2 border-slate-800' 
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            🔒 Password
          </button>
        </div>

        {activeTab === 'convoys' && (
          <>
            {/* Add Form */}
            <div className="p-3 bg-slate-50 border-b flex gap-2 items-center">
              <input
                type="text"
                value={newName}
                onChange={(e) => { setNewName(e.target.value.toUpperCase()); setError(''); }}
                onKeyDown={handleKeyDown}
                placeholder="SGC-101, KBTL-55, TE-12, KS-1, GT-1..."
                className="flex-1 p-2 border border-slate-200 rounded text-sm focus:ring-1 focus:ring-slate-400 outline-none font-mono"
                autoFocus
              />
              <button
                onClick={handleAdd}
                className="px-4 py-2 bg-slate-800 text-white rounded text-xs font-semibold hover:bg-slate-700 transition"
              >
                + Add
              </button>
            </div>

            {error && (
              <div className="px-3 py-2 bg-red-50 text-red-600 text-xs font-medium">
                {error}
              </div>
            )}

            {/* Convoy List */}
            <div className="p-4 max-h-[40vh] overflow-y-auto">
              {['SGC', 'KBTL', 'TE', 'KS', 'GT'].map(fleet => (
                <div key={fleet} className="mb-4">
                  <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-2 pb-1 border-b border-slate-200 flex items-center gap-2">
                    <span 
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ 
                        background: fleet === 'SGC' ? '#00BFFF' : fleet === 'KBTL' ? '#FF6600' : fleet === 'TE' ? '#FFD700' : fleet === 'KS' ? '#22C55E' : '#A855F7'
                      }}
                    />
                    {fleet} Fleet ({byFleet[fleet].length})
                  </div>
                  <div className="grid grid-cols-3 gap-1.5">
                    {byFleet[fleet].map(convoy => (
                      <div 
                        key={convoy._id} 
                        className="flex items-center justify-between bg-slate-100 rounded px-2 py-1 group hover:bg-red-50"
                      >
                        <span className="text-xs text-slate-700 font-medium">{convoy.name}</span>
                        <button
                          onClick={() => handleDelete(convoy._id)}
                          className="text-slate-300 hover:text-red-500 text-sm opacity-0 group-hover:opacity-100"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                    {byFleet[fleet].length === 0 && (
                      <span className="text-xs text-slate-400 italic col-span-3">No convoys</span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Footer */}
            <div className="px-4 py-3 bg-slate-50 border-t flex justify-between items-center">
              <span className="text-[10px] text-slate-400">Total: {convoys.length} convoys</span>
              <button
                onClick={onClose}
                className="px-4 py-2 bg-slate-800 text-white rounded text-xs font-semibold uppercase tracking-wide hover:bg-slate-700 transition"
              >
                Done
              </button>
            </div>
          </>
        )}

        {activeTab === 'password' && (
          <div className="p-6">
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-semibold text-slate-600 uppercase tracking-wide mb-1.5">
                  Current Password
                </label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => { setCurrentPassword(e.target.value); setPasswordMsg({ type: '', text: '' }); }}
                  className="w-full p-2.5 border border-slate-200 rounded text-sm focus:ring-1 focus:ring-slate-400 outline-none"
                />
              </div>
              <div>
                <label className="block text-[10px] font-semibold text-slate-600 uppercase tracking-wide mb-1.5">
                  New Password
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => { setNewPassword(e.target.value); setPasswordMsg({ type: '', text: '' }); }}
                  className="w-full p-2.5 border border-slate-200 rounded text-sm focus:ring-1 focus:ring-slate-400 outline-none"
                />
              </div>
              <div>
                <label className="block text-[10px] font-semibold text-slate-600 uppercase tracking-wide mb-1.5">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => { setConfirmPassword(e.target.value); setPasswordMsg({ type: '', text: '' }); }}
                  className="w-full p-2.5 border border-slate-200 rounded text-sm focus:ring-1 focus:ring-slate-400 outline-none"
                />
              </div>

              {passwordMsg.text && (
                <div className={`text-xs font-medium px-3 py-2 rounded ${
                  passwordMsg.type === 'error' ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'
                }`}>
                  {passwordMsg.text}
                </div>
              )}

              <button
                onClick={handleChangePassword}
                className="w-full py-2.5 bg-slate-800 text-white rounded text-xs font-semibold uppercase tracking-wide hover:bg-slate-700 transition"
              >
                Change Password
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default ConvoysModal;

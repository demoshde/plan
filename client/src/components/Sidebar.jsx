import { useState } from 'react';
import useStore from '../store/useStore';

function Sidebar() {
  const { convoys, shifts, addConvoyToShift, removeConvoyFromShift, reorderShiftConvoy, reorderConvoys, updateConvoy } = useStore();
  const [dragData, setDragData] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState({ shift: null, index: null });
  const [convoyDragData, setConvoyDragData] = useState(null);
  const [convoyDragOverIndex, setConvoyDragOverIndex] = useState(null);

  const getConvoyColor = (name) => {
    if (name.includes('SGC')) return '#00BFFF';
    if (name.includes('KBTL')) return '#FF6600';
    if (name.includes('TE')) return '#FFD700';
    return '#999';
  };

  const getStatusClass = (status) => {
    if (!status) return '';
    return `status-${status}`;
  };

  const statusOptions = [
    { value: '', label: '-' },
    { value: 'down', label: 'Down' },
    { value: 'loaded', label: 'Loaded' },
    { value: 'empty', label: 'Empty' },
    { value: 'hf', label: 'HF' },
    { value: 'gsk', label: 'GSK' },
    { value: 'inspection', label: 'Inspection' }
  ];

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return `${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getDate().toString().padStart(2, '0')}`;
  };

  const availableConvoys = convoys.filter(c => 
    !shifts.day.includes(c.name) && !shifts.night.includes(c.name)
  );

  return (
    <div className="w-[220px] min-w-[220px] bg-white border border-gray-200 rounded-[6px] h-[calc(100vh-64px-48px-48px)] overflow-y-auto sticky top-0 mt-6 mr-6 mb-6 ml-0 shadow-[0_1px_3px_rgba(0,0,0,0.08)]">
      {/* Master List */}
      <div className="border-b border-gray-200">
        <table className="w-full border-collapse text-xs">
          <thead>
            <tr>
              <th className="bg-primary-dark py-2.5 px-1.5 font-semibold text-left border-b-2 border-accent-gold text-white uppercase text-[9px] tracking-wide w-[40%]">
                Convoy
              </th>
              <th className="bg-primary-dark py-2.5 px-1.5 font-semibold text-left border-b-2 border-accent-gold text-white uppercase text-[9px] tracking-wide w-[32%]">
                Status
              </th>
              <th className="bg-primary-dark py-2.5 px-1.5 font-semibold text-left border-b-2 border-accent-gold text-white uppercase text-[9px] tracking-wide w-[28%]">
                Inspect
              </th>
            </tr>
          </thead>
          <tbody>
            {convoys.map((convoy, idx) => (
              <tr 
                key={convoy._id} 
                className={`${getStatusClass(convoy.status)} hover:bg-blue-50 cursor-grab active:cursor-grabbing ${convoyDragOverIndex === idx ? 'border-t-2 border-t-accent-gold' : ''}`}
                draggable
                onDragStart={(e) => {
                  setConvoyDragData({ index: idx, convoy });
                  e.dataTransfer.setData('text/plain', JSON.stringify({ type: 'sidebar-convoy', convoyName: convoy.name }));
                  e.currentTarget.classList.add('opacity-50');
                }}
                onDragEnd={(e) => {
                  e.currentTarget.classList.remove('opacity-50');
                  setConvoyDragData(null);
                  setConvoyDragOverIndex(null);
                }}
                onDragOver={(e) => {
                  e.preventDefault();
                  if (convoyDragData) setConvoyDragOverIndex(idx);
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  if (convoyDragData && convoyDragData.index !== idx) {
                    reorderConvoys(convoyDragData.index, idx);
                  }
                  setConvoyDragData(null);
                  setConvoyDragOverIndex(null);
                }}
              >
                <td className="py-1.5 px-1.5 border-b border-gray-100">
                  <div className="flex items-center gap-1.5 font-bold text-[11px] text-gray-700">
                    <span 
                      className="w-2 h-2 rounded-full flex-shrink-0"
                      style={{ background: getConvoyColor(convoy.name) }}
                    />
                    {convoy.name}
                  </div>
                </td>
                <td className="py-1.5 px-1.5 border-b border-gray-100">
                  <select
                    value={convoy.status || ''}
                    onChange={(e) => updateConvoy(convoy._id, { status: e.target.value })}
                    className={`w-full p-1 border-none rounded text-[10px] font-semibold bg-gray-100 cursor-pointer text-center ${getStatusClass(convoy.status)}`}
                  >
                    {statusOptions.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </td>
                <td className="py-1.5 px-1.5 border-b border-gray-100">
                  <div className="date-wrapper">
                    <input
                      type="date"
                      value={convoy.inspectionDate ? convoy.inspectionDate.split('T')[0] : ''}
                      onChange={(e) => updateConvoy(convoy._id, { inspectionDate: e.target.value })}
                      className="master-date-input"
                    />
                    <div className="date-display">
                      {formatDate(convoy.inspectionDate)}
                    </div>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Shift Columns */}
      <div className="grid grid-cols-2">
        {/* Day Shift */}
        <div className="border-r border-gray-200">
          <div className="bg-amber-50 py-1.5 px-2 font-semibold text-[10px] text-amber-700 text-center border-b border-gray-200 flex items-center justify-center gap-1">
            ☀️ Өдөр
          </div>
          <div 
            className={`min-h-[100px] p-1 ${dragOverIndex.shift === 'day' && dragOverIndex.index === -1 ? 'bg-blue-50' : ''}`}
            onDragOver={(e) => {
              e.preventDefault();
              if (dragData) setDragOverIndex({ shift: 'day', index: -1 });
            }}
            onDragLeave={() => setDragOverIndex({ shift: null, index: null })}
            onDrop={(e) => {
              e.preventDefault();
              if (dragData) {
                reorderShiftConvoy(dragData.shift, dragData.index, 'day', shifts.day.length);
                setDragData(null);
                setDragOverIndex({ shift: null, index: null });
              }
            }}
          >
            {shifts.day.map((convoy, idx) => (
              <div 
                key={convoy} 
                className={`p-1.5 border border-gray-100 rounded mb-1 text-[10px] flex items-center gap-1 bg-white hover:bg-blue-50 cursor-grab active:cursor-grabbing ${dragOverIndex.shift === 'day' && dragOverIndex.index === idx ? 'border-t-2 border-t-accent-gold' : ''}`}
                draggable
                onDragStart={(e) => {
                  setDragData({ shift: 'day', index: idx, convoy });
                  e.currentTarget.classList.add('opacity-50');
                }}
                onDragEnd={(e) => {
                  e.currentTarget.classList.remove('opacity-50');
                  setDragData(null);
                  setDragOverIndex({ shift: null, index: null });
                }}
                onDragOver={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  if (dragData) setDragOverIndex({ shift: 'day', index: idx });
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  if (dragData) {
                    reorderShiftConvoy(dragData.shift, dragData.index, 'day', idx);
                    setDragData(null);
                    setDragOverIndex({ shift: null, index: null });
                  }
                }}
              >
                <span className="w-3.5 h-3.5 bg-gray-200 rounded-full flex items-center justify-center text-[8px] font-semibold text-gray-600">
                  {idx + 1}
                </span>
                <span className="font-semibold text-gray-700 flex items-center gap-1">
                  <span 
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ background: getConvoyColor(convoy) }}
                  />
                  {convoy}
                </span>
                <span 
                  onClick={() => removeConvoyFromShift('day', convoy)}
                  className="ml-auto cursor-pointer text-gray-400 text-[10px] hover:text-red-500"
                >
                  ✕
                </span>
              </div>
            ))}
            <select
              onChange={(e) => {
                if (e.target.value) {
                  addConvoyToShift('day', e.target.value);
                  e.target.value = '';
                }
              }}
              className="w-[calc(100%-6px)] m-[3px] p-1 text-[9px] border border-dashed border-gray-300 rounded bg-gray-50 cursor-pointer"
            >
              <option value="">+ Нэмэх</option>
              {availableConvoys.map(c => (
                <option key={c._id} value={c.name}>{c.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Night Shift */}
        <div>
          <div className="bg-slate-100 py-1.5 px-2 font-semibold text-[10px] text-slate-600 text-center border-b border-gray-200 flex items-center justify-center gap-1">
            🌙 Шөнө
          </div>
          <div 
            className={`min-h-[100px] p-1 ${dragOverIndex.shift === 'night' && dragOverIndex.index === -1 ? 'bg-blue-50' : ''}`}
            onDragOver={(e) => {
              e.preventDefault();
              if (dragData) setDragOverIndex({ shift: 'night', index: -1 });
            }}
            onDragLeave={() => setDragOverIndex({ shift: null, index: null })}
            onDrop={(e) => {
              e.preventDefault();
              if (dragData) {
                reorderShiftConvoy(dragData.shift, dragData.index, 'night', shifts.night.length);
                setDragData(null);
                setDragOverIndex({ shift: null, index: null });
              }
            }}
          >
            {shifts.night.map((convoy, idx) => (
              <div 
                key={convoy} 
                className={`p-1.5 border border-gray-100 rounded mb-1 text-[10px] flex items-center gap-1 bg-white hover:bg-blue-50 cursor-grab active:cursor-grabbing ${dragOverIndex.shift === 'night' && dragOverIndex.index === idx ? 'border-t-2 border-t-accent-gold' : ''}`}
                draggable
                onDragStart={(e) => {
                  setDragData({ shift: 'night', index: idx, convoy });
                  e.currentTarget.classList.add('opacity-50');
                }}
                onDragEnd={(e) => {
                  e.currentTarget.classList.remove('opacity-50');
                  setDragData(null);
                  setDragOverIndex({ shift: null, index: null });
                }}
                onDragOver={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  if (dragData) setDragOverIndex({ shift: 'night', index: idx });
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  if (dragData) {
                    reorderShiftConvoy(dragData.shift, dragData.index, 'night', idx);
                    setDragData(null);
                    setDragOverIndex({ shift: null, index: null });
                  }
                }}
              >
                <span className="w-3.5 h-3.5 bg-gray-200 rounded-full flex items-center justify-center text-[8px] font-semibold text-gray-600">
                  {idx + 1}
                </span>
                <span className="font-semibold text-gray-700 flex items-center gap-1">
                  <span 
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ background: getConvoyColor(convoy) }}
                  />
                  {convoy}
                </span>
                <span 
                  onClick={() => removeConvoyFromShift('night', convoy)}
                  className="ml-auto cursor-pointer text-gray-400 text-[10px] hover:text-red-500"
                >
                  ✕
                </span>
              </div>
            ))}
            <select
              onChange={(e) => {
                if (e.target.value) {
                  addConvoyToShift('night', e.target.value);
                  e.target.value = '';
                }
              }}
              className="w-[calc(100%-6px)] m-[3px] p-1 text-[9px] border border-dashed border-gray-300 rounded bg-gray-50 cursor-pointer"
            >
              <option value="">+ Нэмэх</option>
              {availableConvoys.map(c => (
                <option key={c._id} value={c.name}>{c.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Sidebar;

import { useState } from 'react';
import useStore from '../store/useStore';

function DispatchRow({ dateKey, rowIndex, row }) {
  const { convoys, updateDispatchRow, toggleReturned } = useStore();
  const [isDragging, setIsDragging] = useState(false);

  const getConvoyColor = (name) => {
    if (!name) return '#999';
    if (name.includes('SGC')) return '#00BFFF';
    if (name.includes('KBTL')) return '#FF6600';
    if (name.includes('TE')) return '#FFD700';
    return '#999';
  };

  const isViolation = (timeStr) => {
    if (!timeStr) return false;
    const [h, m] = timeStr.split(':').map(Number);
    return (h >= 12 && m > 0) || h > 12;
  };

  const generateTimeOptions = (type) => {
    const times = [''];
    const ranges = type === 'start' 
      ? [[0, 12], [18, 24]]
      : [[0, 24]];
    
    ranges.forEach(([startH, endH]) => {
      for (let h = startH; h < endH; h++) {
        for (let m = 0; m < 60; m += 30) {
          times.push(`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`);
        }
      }
    });
    return times;
  };

  const convoyOptions = ['', ...convoys.map(c => c.name)];
  const totalClass = isViolation(row.totalHours) ? 'val-red' : '';

  const handleDragStart = (e) => {
    setIsDragging(true);
    e.dataTransfer.setData('text/plain', JSON.stringify({ dateKey, rowIndex }));
  };

  const handleDragEnd = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const data = JSON.parse(e.dataTransfer.getData('text/plain'));
    if (data.dateKey === dateKey) {
      const { reorderRows } = useStore.getState();
      reorderRows(dateKey, data.rowIndex, rowIndex);
    }
  };

  return (
    <div
      className={`data-row grid grid-cols-[24px_1.5fr_0.9fr_0.9fr_0.7fr_28px] border-b border-[#eef0f2] h-[38px] items-center bg-[#fafbfc] even:bg-white ${isDragging ? 'dragging' : ''} hover:bg-[#f0f4f8] transition-colors`}
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragOver={(e) => e.preventDefault()}
      onDrop={handleDrop}
    >
      {/* Drag Handle */}
      <div className="cursor-grab text-center text-[#bbb] text-sm hover:text-accent-gold active:cursor-grabbing">
        ⣿
      </div>

      {/* Convoy Select */}
      <div className="flex items-center h-full px-1">
        {row.convoyName && (
          <svg width="16" height="16" viewBox="0 0 24 24" fill={getConvoyColor(row.convoyName)} className="mr-1 flex-shrink-0">
            <path d="M20 8h-3V4H3c-1.1 0-2 .9-2 2v11h2c0 1.66 1.34 3 3 3s3-1.34 3-3h6c0 1.66 1.34 3 3 3s3-1.34 3-3h2v-5l-3-4zM6 18.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm13.5-9l1.96 2.5H17V9.5h2.5zm-1.5 9c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"/>
          </svg>
        )}
        <select
          value={row.convoyName}
          onChange={(e) => updateDispatchRow(dateKey, rowIndex, 'convoyName', e.target.value)}
          className="w-full h-full border-none text-left pl-1 text-[12px] bg-transparent font-medium cursor-pointer focus:outline-none focus:ring-2 focus:ring-accent-gold"
          style={{ fontFamily: '"IBM Plex Sans", monospace' }}
        >
          {convoyOptions.map(opt => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
      </div>

      {/* Start Time */}
      <select
        value={row.startTime}
        onChange={(e) => updateDispatchRow(dateKey, rowIndex, 'startTime', e.target.value)}
        className="w-full h-full border-none text-center text-[12px] bg-transparent font-medium cursor-pointer focus:outline-none focus:ring-2 focus:ring-accent-gold"
        style={{ fontFamily: '"IBM Plex Sans", monospace' }}
      >
        {generateTimeOptions('start').map(t => (
          <option key={t} value={t}>{t}</option>
        ))}
      </select>

      {/* End Time */}
      <select
        value={row.endTime}
        onChange={(e) => updateDispatchRow(dateKey, rowIndex, 'endTime', e.target.value)}
        className="w-full h-full border-none text-center text-[12px] bg-transparent font-medium cursor-pointer focus:outline-none focus:ring-2 focus:ring-accent-gold"
        style={{ fontFamily: '"IBM Plex Sans", monospace' }}
      >
        {generateTimeOptions('end').map(t => (
          <option key={t} value={t}>{t}</option>
        ))}
      </select>

      {/* Total Hours */}
      <input
        type="text"
        value={row.totalHours}
        readOnly
        className={`w-full h-full border-none text-center text-[12px] bg-transparent font-bold ${totalClass}`}
        style={{ fontFamily: '"IBM Plex Sans", monospace' }}
      />

      {/* Return Indicator */}
      <div
        onClick={() => toggleReturned(dateKey, rowIndex)}
        className={`text-center text-sm cursor-pointer transition-colors ${
          row.returned 
            ? 'text-[#27ae60] hover:text-[#219a52]' 
            : 'text-transparent hover:text-[#ccc]'
        }`}
      >
        ↩
      </div>
    </div>
  );
}

export default DispatchRow;

import { useState } from 'react';
import useStore from '../store/useStore';
import DispatchRow from './DispatchRow';

function DayColumn({ dateKey, display, dispatch, dailyPlan }) {
  const { addConvoyToDay } = useStore();
  const [isDragOver, setIsDragOver] = useState(false);
  const rows = dispatch?.rows || [];
  
  const convoyCount = rows.filter(r => r.convoyName).length;
  const returnCount = rows.filter(r => r.returned).length;
  const planDiff = dailyPlan > 0 ? (convoyCount - dailyPlan) : null;

  return (
    <div className="bg-white border border-gray-200 rounded-[6px] min-w-[260px] flex flex-col shadow-[0_1px_3px_rgba(0,0,0,0.08)] overflow-hidden">
      {/* Header */}
      <div className="text-center py-3 px-3 font-bold text-[13px] bg-primary-dark text-white uppercase tracking-[0.5px] border-b-2 border-accent-gold flex items-center justify-center gap-2">
        <span>{display}</span>
        {convoyCount > 0 && (
          <span className="bg-accent-gold text-primary-dark text-[11px] font-bold py-[2px] px-2 rounded-[10px] min-w-[24px]">
            {convoyCount}
          </span>
        )}
        {returnCount > 0 && (
          <span className="bg-[#27ae60] text-white text-[11px] font-bold py-[2px] px-2 rounded-[10px] min-w-[24px]">
            {returnCount}
          </span>
        )}
      </div>

      {/* Plan Row */}
      {dailyPlan > 0 && (
        <div className="flex items-center gap-2 py-2 px-3 bg-[#eff6ff] rounded-[6px] mx-2 mt-2 mb-2">
          <span className="text-[11px] font-semibold text-[#2563eb]">Plan:</span>
          <span className="font-bold text-[#2563eb]">{dailyPlan}</span>
          {planDiff !== null && (
            <span className={`text-[11px] font-bold ${planDiff >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {planDiff >= 0 ? '+' : ''}{planDiff}
            </span>
          )}
        </div>
      )}

      {/* Table Header */}
      <div className="grid grid-cols-[24px_1.5fr_0.9fr_0.9fr_0.7fr_28px] bg-[#f8f9fa] font-semibold text-center py-[10px] border-b border-gray-200 text-[10px] text-gray-500 uppercase tracking-[0.8px]">
        <div>⋮⋮</div>
        <div>Convoy</div>
        <div>Start</div>
        <div>End</div>
        <div>Hrs</div>
        <div>↩</div>
      </div>

      {/* Rows */}
      <div 
        className={`flex-grow min-h-[200px] ${isDragOver ? 'bg-blue-50' : ''}`}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragOver(true);
        }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragOver(false);
          try {
            const data = JSON.parse(e.dataTransfer.getData('text/plain'));
            if (data.type === 'sidebar-convoy') {
              addConvoyToDay(dateKey, data.convoyName);
            }
          } catch (err) {
            console.error('Drop error:', err);
          }
        }}
      >
        {rows.map((row, idx) => (
          <DispatchRow
            key={idx}
            dateKey={dateKey}
            rowIndex={idx}
            row={row}
          />
        ))}
      </div>
    </div>
  );
}

export default DayColumn;

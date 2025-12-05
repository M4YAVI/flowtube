import React from 'react';
import { AppStatus } from '../types';
import { Loader2, CheckCircle2, AlertCircle, CircleDashed } from 'lucide-react';

interface StatusBadgeProps {
  status: AppStatus;
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  if (status === AppStatus.IDLE) return null;

  return (
    <div className={`
      flex items-center gap-2.5 px-4 py-2 rounded-full border backdrop-blur-md shadow-lg transition-all duration-300
      ${status === AppStatus.GENERATING ? 'bg-indigo-500/10 border-indigo-500/20 text-indigo-300' : ''}
      ${status === AppStatus.COMPLETE ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300' : ''}
      ${status === AppStatus.ERROR ? 'bg-rose-500/10 border-rose-500/20 text-rose-300' : ''}
    `}>
      {status === AppStatus.GENERATING && (
        <>
          <Loader2 className="w-4 h-4 animate-spin" />
          <span className="text-xs font-bold tracking-wide uppercase">Generating Logic...</span>
        </>
      )}
      
      {status === AppStatus.COMPLETE && (
        <>
          <CheckCircle2 className="w-4 h-4" />
          <span className="text-xs font-bold tracking-wide uppercase">Ready</span>
        </>
      )}

      {status === AppStatus.ERROR && (
        <>
          <AlertCircle className="w-4 h-4" />
          <span className="text-xs font-bold tracking-wide uppercase">Failed</span>
        </>
      )}
    </div>
  );
};

export default StatusBadge;
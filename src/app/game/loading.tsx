import React from 'react';

export default function GameLoading() {
  return (
    <div className="w-screen h-screen bg-bgap-dark flex flex-col items-center justify-center text-center p-6 select-none">
      <div className="w-14 h-14 rounded-2xl bg-bgap-cyan/10 border border-bgap-cyan/30 flex items-center justify-center mb-6">
        <span className="w-7 h-7 rounded-full border-2 border-bgap-cyan border-t-transparent animate-spin" />
      </div>
      <h2 className="text-lg font-bold text-bgap-text mb-1">Loading BGAP City District...</h2>
      <p className="text-xs text-bgap-muted font-mono">Connecting to authoritative game servers</p>
    </div>
  );
}

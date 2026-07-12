import React from "react";
import { Wrench, ShieldAlert } from "lucide-react";

interface PlaceholderProps {
  moduleName: string;
  assignedTo: string;
}

export const Placeholder: React.FC<PlaceholderProps> = ({ moduleName, assignedTo }) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6">
      <div className="w-16 h-16 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-500 mb-6 animate-pulse">
        <Wrench className="w-8 h-8" />
      </div>
      <h1 className="text-xl font-bold text-white mb-2">{moduleName} Module</h1>
      <p className="text-slate-400 text-sm max-w-md mb-6">
        This screen is part of the AssetFlow hackathon specifications and is assigned to developer **{assignedTo}**.
      </p>
      <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-950/20 border border-blue-900/20 text-xs font-semibold text-blue-400">
        <ShieldAlert className="w-4 h-4 shrink-0" />
        Backend APIs & queries are ready to be bound.
      </div>
    </div>
  );
};

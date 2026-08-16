import React from 'react';

interface FieldTooltipProps {
  content: string;
}

export const FieldTooltip: React.FC<FieldTooltipProps> = ({ content }) => {
  return (
    <span className="relative inline-flex items-center ml-1.5 group cursor-help align-middle hover:z-[100000]">
      <span className="flex items-center justify-center size-4 text-[10px] font-bold text-gray-500 bg-gray-100 group-hover:bg-brand-500 group-hover:text-gray-950 dark:bg-gray-800 dark:text-gray-400 dark:group-hover:bg-brand-500 dark:group-hover:text-gray-950 rounded-full border border-gray-300 dark:border-gray-700 transition-colors shadow-xs">
        ?
      </span>
      <span className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block w-64 p-2.5 text-xs font-normal leading-relaxed text-white bg-gray-900 dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-700 text-center z-[100000] animate-fadeIn">
        {content}
        <span className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900 dark:border-t-gray-800" />
      </span>
    </span>
  );
};

export default FieldTooltip;

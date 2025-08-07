
import React from 'react';

interface ProgressBarProps {
  value: number;
  max: number;
}

const ProgressBar: React.FC<ProgressBarProps> = ({ value, max }) => {
  const percentage = max > 0 ? (value / max) * 100 : 0;
  const safePercentage = Math.min(100, Math.max(0, percentage));

  let colorClass = 'bg-green-500';
  if (safePercentage > 75) colorClass = 'bg-yellow-500';
  if (safePercentage >= 100) colorClass = 'bg-red-500';

  return (
    <div className="w-full bg-gray-700 rounded-full h-2.5">
      <div
        className={`h-2.5 rounded-full transition-all duration-500 ${colorClass}`}
        style={{ width: `${safePercentage}%` }}
      ></div>
    </div>
  );
};

export default ProgressBar;

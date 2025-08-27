
import React from 'react';
import Card from './common/Card';

const TrainingPlanner: React.FC = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = new Date(year, month, 1).getDay();

  // Simple event data for demonstration
  const events = {
    3: { text: 'Strength & Conditioning', color: 'bg-blue-500' },
    5: { text: 'Defensive Schemes (Basketball)', color: 'bg-purple-500' },
    7: { text: 'Recovery Day', color: 'bg-green-500' },
    10: { text: 'Game Day vs. Eagles', color: 'bg-red-600 font-bold' },
    12: { text: 'Video Analysis (Rugby)', color: 'bg-yellow-500' },
    15: { text: 'Lineout & Scrum Practice (Rugby)', color: 'bg-purple-500' },
    17: { text: 'Recovery Day', color: 'bg-green-500' },
    20: { text: 'Away Game @ Panthers', color: 'bg-red-600 font-bold' },
    24: { text: 'Full Team Scrimmage', color: 'bg-blue-500' },
    28: { text: 'Shooting Drills (Basketball)', color: 'bg-purple-500' },
  };

  const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const blanks = Array(firstDayOfMonth).fill(null);
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  return (
    <Card>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-brand-cyan">
          {today.toLocaleString('default', { month: 'long' })} {year}
        </h2>
        <p className="text-brand-light">This is a read-only visual planner.</p>
      </div>
      <div className="grid grid-cols-7 gap-1">
        {weekdays.map(day => (
          <div key={day} className="text-center font-bold text-brand-light p-2">{day}</div>
        ))}
        {blanks.map((_, index) => (
          <div key={`blank-${index}`} className="border border-brand-accent rounded-md h-28"></div>
        ))}
        {days.map(day => {
          const event = events[day as keyof typeof events];
          const isToday = day === today.getDate();
          return (
            <div key={day} className={`border border-brand-accent rounded-md h-28 p-2 flex flex-col ${isToday ? 'bg-brand-accent' : ''}`}>
              <div className={`font-bold ${isToday ? 'text-brand-cyan' : 'text-brand-text'}`}>{day}</div>
              {event && (
                <div className={`mt-1 p-1.5 text-xs rounded-md text-white text-center ${event.color}`}>
                  {event.text}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </Card>
  );
};

export default TrainingPlanner;
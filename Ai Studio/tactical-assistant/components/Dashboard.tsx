
import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import { TeamPerformanceData, PlayerTackleData, PlayerSkillData } from '../types';
import Card from './common/Card';

const teamPerformanceData: TeamPerformanceData[] = [
  { match: 1, passingAccuracy: 75, possession: 55 },
  { match: 2, passingAccuracy: 78, possession: 60 },
  { match: 3, passingAccuracy: 82, possession: 58 },
  { match: 4, passingAccuracy: 80, possession: 62 },
  { match: 5, passingAccuracy: 85, possession: 65 },
];

const playerTackleData: PlayerTackleData[] = [
    { name: 'Player A', won: 8, lost: 3 },
    { name: 'Player B', won: 12, lost: 2 },
    { name: 'Player C', won: 5, lost: 5 },
    { name: 'Player D', won: 9, lost: 1 },
];

const playerSkillData: PlayerSkillData[] = [
    { subject: 'Shooting', A: 80, fullMark: 100 },
    { subject: 'Ball Handling', A: 85, fullMark: 100 },
    { subject: 'Rebounding', A: 70, fullMark: 100 },
    { subject: 'On-Ball Defense', A: 90, fullMark: 100 },
    { subject: 'Playmaking', A: 75, fullMark: 100 },
];


const Dashboard: React.FC = () => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <Card className="lg:col-span-3">
        <h2 className="text-xl font-bold mb-4 text-brand-cyan">Team Performance Over Time</h2>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={teamPerformanceData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#415A77" />
            <XAxis dataKey="match" tick={{ fill: '#E0E1DD' }} label={{ value: 'Match Number', position: 'insideBottom', offset: -10, fill: '#E0E1DD' }} />
            <YAxis tick={{ fill: '#E0E1DD' }} />
            <Tooltip contentStyle={{ backgroundColor: '#1B263B', border: '1px solid #415A77' }} />
            <Legend wrapperStyle={{ color: '#E0E1DD' }} />
            <Line type="monotone" dataKey="passingAccuracy" name="Passing Accuracy (%)" stroke="#00F5D4" strokeWidth={2} />
            <Line type="monotone" dataKey="possession" name="Possession (%)" stroke="#778DA9" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </Card>

      <Card className="lg:col-span-2">
        <h2 className="text-xl font-bold mb-4 text-brand-cyan">Rugby Player Tackle Success</h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={playerTackleData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#415A77" />
            <XAxis dataKey="name" tick={{ fill: '#E0E1DD' }} />
            <YAxis tick={{ fill: '#E0E1DD' }} />
            <Tooltip contentStyle={{ backgroundColor: '#1B263B', border: '1px solid #415A77' }} />
            <Legend wrapperStyle={{ color: '#E0E1DD' }} />
            <Bar dataKey="won" stackId="a" fill="#00F5D4" name="Tackles Won" />
            <Bar dataKey="lost" stackId="a" fill="#415A77" name="Tackles Lost" />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      <Card>
        <h2 className="text-xl font-bold mb-4 text-brand-cyan">Basketball Player Skill Radar</h2>
        <ResponsiveContainer width="100%" height={300}>
            <RadarChart cx="50%" cy="50%" outerRadius="80%" data={playerSkillData}>
                <PolarGrid stroke="#415A77"/>
                <PolarAngleAxis dataKey="subject" tick={{ fill: '#E0E1DD' }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                <Radar name="Player X" dataKey="A" stroke="#00F5D4" fill="#00F5D4" fillOpacity={0.6} />
                <Tooltip contentStyle={{ backgroundColor: '#1B263B', border: '1px solid #415A77' }} />
            </RadarChart>
        </ResponsiveContainer>
      </Card>
    </div>
  );
};

export default Dashboard;
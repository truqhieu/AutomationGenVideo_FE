'use client';

import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

interface EngagementBreakdownProps {
  stats?: {
    totalLikes: number;
    totalComments: number;
    totalShares: number;
    totalViews: number;
  };
}

export default function EngagementBreakdown({ stats }: EngagementBreakdownProps) {
  // Calculate engagement breakdown
  const totalEngagement = (stats?.totalLikes || 0) + (stats?.totalComments || 0) + (stats?.totalShares || 0);
  const totalViews = stats?.totalViews || 0;
  const engagementRate = totalViews > 0 ? ((totalEngagement / totalViews) * 100).toFixed(2) : '0.00';
  
  const data = [
    {
      name: 'Likes',
      value: stats?.totalLikes || 0,
      percentage: totalEngagement > 0 ? ((stats?.totalLikes || 0) / totalEngagement * 100).toFixed(1) : 0,
      color: '#ec4899',
    },
    {
      name: 'Comments',
      value: stats?.totalComments || 0,
      percentage: totalEngagement > 0 ? ((stats?.totalComments || 0) / totalEngagement * 100).toFixed(1) : 0,
      color: '#06b6d4',
    },
    {
      name: 'Shares',
      value: stats?.totalShares || 0,
      percentage: totalEngagement > 0 ? ((stats?.totalShares || 0) / totalEngagement * 100).toFixed(1) : 0,
      color: '#1e293b',
    },
  ];

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-900 text-white p-3 rounded-lg shadow-lg text-xs">
          <p className="font-semibold">{payload[0].name}</p>
          <p className="mt-1">
            Count: <span className="font-bold">{new Intl.NumberFormat('en-US').format(payload[0].value)}</span>
          </p>
          <p>
            Percentage: <span className="font-bold">{payload[0].payload.percentage}%</span>
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6">
      <div className="flex items-center gap-2 mb-6">
        <span className="text-lg">🎯</span>
        <h3 className="text-lg font-bold text-slate-900">Engagement Breakdown</h3>
      </div>

      <div className="h-64 relative">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={90}
              paddingAngle={2}
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
        
        {/* Center Label Overlay */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-center">
            <p className="text-xs text-slate-400 font-medium">Engagement</p>
            <p className="text-3xl font-bold text-slate-900 mt-1">{engagementRate}%</p>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex justify-center gap-6 mt-4">
        {data.map((item) => (
          <div key={item.name} className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
            <span className="text-xs text-slate-600 font-medium">
              {item.name} {item.percentage}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

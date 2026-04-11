import { motion } from 'framer-motion';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass-strong rounded-xl p-3 shadow-xl">
      <p className="text-xs font-medium text-foreground mb-2">{label}</p>
      {payload.map((entry, i) => (
        <div key={i} className="flex items-center gap-2 text-xs">
          <div className="w-2 h-2 rounded-full" style={{ background: entry.color }} />
          <span className="text-muted-foreground">{entry.name}:</span>
          <span className="font-medium">{entry.value}%</span>
        </div>
      ))}
    </div>
  );
};

export default function PerformanceChart({ data, dataKeys }) {
  const colors = {
    confidence: '#8b5cf6',
    eyeContact: '#22d3ee',
    posture: '#34d399',
    speechPace: '#fbbf24',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-strong rounded-2xl p-5"
    >
      <h3 className="text-sm font-space font-semibold uppercase tracking-wider text-muted-foreground mb-4">
        Performance Over Time
      </h3>
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
            <defs>
              {dataKeys.map(key => (
                <linearGradient key={key} id={`gradient-${key}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={colors[key]} stopOpacity={0.3} />
                  <stop offset="100%" stopColor={colors[key]} stopOpacity={0} />
                </linearGradient>
              ))}
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(240, 10%, 16%)" />
            <XAxis
              dataKey="date"
              tick={{ fill: 'hsl(220, 10%, 55%)', fontSize: 11 }}
              axisLine={{ stroke: 'hsl(240, 10%, 16%)' }}
              tickLine={false}
            />
            <YAxis
              domain={[0, 100]}
              tick={{ fill: 'hsl(220, 10%, 55%)', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip content={<CustomTooltip />} />
            {dataKeys.map(key => (
              <Area
                key={key}
                type="monotone"
                dataKey={key}
                stroke={colors[key]}
                fill={`url(#gradient-${key})`}
                strokeWidth={2}
                dot={{ fill: colors[key], r: 3, strokeWidth: 0 }}
                activeDot={{ r: 5, fill: colors[key], stroke: 'hsl(240, 12%, 8%)', strokeWidth: 2 }}
              />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
}
// app/chat/DynamicChart.tsx
"use client";

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell, LineChart, Line,
  ResponsiveContainer
} from 'recharts';

interface ChartProps {
  chartSpec: {
    chartType: "bar" | "pie" | "line";
    params: {
      category: string; // X-axis / Label
      metric: string;   // Y-axis / Value
    };
  };
  data: any[];
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

export default function DynamicChart({ chartSpec, data }: ChartProps) {
  const { chartType, params } = chartSpec;
  const { category, metric } = params;

  if (!data || data.length === 0) {
    return <p className="text-gray-400">No data available to plot.</p>;
  }
  
  // Ensure data has the required keys.
  const chartData = data.map(item => ({
      ...item,
      // Convert metric to a number if it's not already
      [metric]: Number(item[metric]) 
  }));

  return (
    <div className="w-full h-80 bg-gray-800 p-4 rounded-lg">
      <ResponsiveContainer width="100%" height="100%">
        {chartType === 'bar' && (
          <BarChart data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#555" />
            <XAxis dataKey={category} stroke="#ccc" />
            <YAxis stroke="#ccc" />
            <Tooltip contentStyle={{ backgroundColor: '#222', border: 'none' }} />
            <Legend />
            <Bar dataKey={metric} fill="#82ca9d" />
          </BarChart>
        )}

        {chartType === 'line' && (
          <LineChart data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#555" />
            <XAxis dataKey={category} stroke="#ccc" />
            <YAxis stroke="#ccc" />
            <Tooltip contentStyle={{ backgroundColor: '#222', border: 'none' }} />
            <Legend />
            <Line type="monotone" dataKey={metric} stroke="#8884d8" />
          </LineChart>
        )}

        {chartType === 'pie' && (
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              labelLine={false}
              outerRadius={100}
              fill="#8884d8"
              dataKey={metric} // The value
              nameKey={category} // The label
              label={(entry) => entry[category]}
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip contentStyle={{ backgroundColor: '#222', border: 'none' }} />
            <Legend />
          </PieChart>
        )}
      </ResponsiveContainer>
    </div>
  );
}
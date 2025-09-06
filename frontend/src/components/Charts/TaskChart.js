// components/Charts/TaskChart.js
import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

const TaskChart = ({ data }) => {
  const statusData = [
    { name: 'Pending', value: data.byStatus.Pending || 0 },
    { name: 'In Progress', value: data.byStatus['In Progress'] || 0 },
    { name: 'Completed', value: data.byStatus.Completed || 0 },
    { name: 'Cancelled', value: data.byStatus.Cancelled || 0 }
  ];

  const priorityData = [
    { name: 'Low', value: data.byPriority.Low || 0 },
    { name: 'Medium', value: data.byPriority.Medium || 0 },
    { name: 'High', value: data.byPriority.High || 0 },
    { name: 'Urgent', value: data.byPriority.Urgent || 0 }
  ];

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div>
        <h3>Tasks by Status</h3>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={statusData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {statusData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div>
        <h3>Tasks by Priority</h3>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={priorityData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {priorityData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default TaskChart;
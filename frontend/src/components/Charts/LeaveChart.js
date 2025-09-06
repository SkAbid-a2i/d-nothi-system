// src/components/Charts/LeaveChart.js
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const LeaveChart = ({ data }) => {
  const chartData = [
    { name: 'Pending', count: data.byStatus.Pending || 0 },
    { name: 'Approved', count: data.byStatus.Approved || 0 },
    { name: 'Rejected', count: data.byStatus.Rejected || 0 }
  ];

  const leaveTypeData = Object.entries(data.byLeaveType || {}).map(([name, count]) => ({
    name,
    count
  }));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
      <div>
        <h3>Leaves by Status</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="count" fill="#8884d8" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {leaveTypeData.length > 0 && (
        <div>
          <h3>Leaves by Type</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={leaveTypeData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="count" fill="#82ca9d" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
};

export default LeaveChart;
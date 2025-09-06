// utils/exportUtils.js
const { Parser } = require('json2csv');
const pdf = require('html-pdf');

const exportToCSV = (data, fields) => {
  try {
    const parser = new Parser({ fields });
    return parser.parse(data);
  } catch (error) {
    throw new Error('Error generating CSV');
  }
};

const exportToPDF = (html, options = {}) => {
  return new Promise((resolve, reject) => {
    const defaultOptions = {
      format: 'A4',
      orientation: 'portrait',
      border: '10mm',
      ...options
    };

    pdf.create(html, defaultOptions).toBuffer((err, buffer) => {
      if (err) {
        reject(new Error('Error generating PDF'));
      } else {
        resolve(buffer);
      }
    });
  });
};

const generateTaskReportHTML = (tasks, summary) => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; margin: 40px; }
        h1 { color: #1976d2; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f5f5f5; }
        .summary { background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0; }
      </style>
    </head>
    <body>
      <h1>Task Management Report</h1>
      <p>Generated on: ${new Date().toLocaleDateString()}</p>
      
      <div class="summary">
        <h3>Summary</h3>
        <p>Total Tasks: ${summary.total}</p>
        <p>Pending: ${summary.byStatus.Pending || 0}</p>
        <p>In Progress: ${summary.byStatus['In Progress'] || 0}</p>
        <p>Completed: ${summary.byStatus.Completed || 0}</p>
      </div>

      <table>
        <thead>
          <tr>
            <th>Title</th>
            <th>Status</th>
            <th>Priority</th>
            <th>Assigned To</th>
            <th>Due Date</th>
          </tr>
        </thead>
        <tbody>
          ${tasks.map(task => `
            <tr>
              <td>${task.title}</td>
              <td>${task.status}</td>
              <td>${task.priority}</td>
              <td>${task.assigned_to_name}</td>
              <td>${new Date(task.due_date).toLocaleDateString()}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </body>
    </html>
  `;
};

module.exports = {
  exportToCSV,
  exportToPDF,
  generateTaskReportHTML
};
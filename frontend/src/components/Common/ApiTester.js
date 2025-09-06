// frontend/src/components/Common/ApiTester.js
import React, { useState } from 'react';
import { Box, Button, Typography, Alert, Paper } from '@mui/material';

const ApiTester = () => {
  const [testResult, setTestResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const testApiConnection = async () => {
    setLoading(true);
    setTestResult(null);
    
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/health`);
      const data = await response.json();
      
      setTestResult({
        success: true,
        status: response.status,
        data: data
      });
    } catch (error) {
      setTestResult({
        success: false,
        error: error.message,
        details: error
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Paper sx={{ p: 2, mt: 2 }}>
      <Typography variant="h6" gutterBottom>
        API Connection Test
      </Typography>
      
      <Button 
        variant="outlined" 
        onClick={testApiConnection}
        disabled={loading}
      >
        {loading ? 'Testing...' : 'Test API Connection'}
      </Button>

      {testResult && (
        <Box sx={{ mt: 2 }}>
          {testResult.success ? (
            <Alert severity="success">
              API Connection Successful!
              <br />
              Status: {testResult.status}
              <br />
              Response: {JSON.stringify(testResult.data)}
            </Alert>
          ) : (
            <Alert severity="error">
              API Connection Failed!
              <br />
              Error: {testResult.error}
            </Alert>
          )}
        </Box>
      )}

      <Box sx={{ mt: 2 }}>
        <Typography variant="body2">
          API URL: {process.env.REACT_APP_API_URL}
        </Typography>
        <Typography variant="body2">
          Environment: {process.env.NODE_ENV}
        </Typography>
      </Box>
    </Paper>
  );
};

export default ApiTester;
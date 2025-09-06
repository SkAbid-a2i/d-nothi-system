// src/components/Common/ErrorBoundary.js
import React from 'react';
import { Box, Typography, Button, Paper } from '@mui/material';
import { Error as ErrorIcon } from '@mui/icons-material';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({
      error: error,
      errorInfo: errorInfo
    });
    
    // Log error to monitoring service
    console.error('Error caught by boundary:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <Box sx={{ p: 3, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
          <Paper sx={{ p: 4, textAlign: 'center', maxWidth: 600 }}>
            <ErrorIcon color="error" sx={{ fontSize: 64, mb: 2 }} />
            <Typography variant="h4" gutterBottom color="error">
              Something went wrong
            </Typography>
            <Typography variant="body1" sx={{ mb: 3 }}>
              We're sorry, but something went wrong. Please try refreshing the page or contact support if the problem persists.
            </Typography>
            {process.env.NODE_ENV === 'development' && (
              <Box sx={{ textAlign: 'left', mb: 3 }}>
                <Typography variant="h6">Error Details:</Typography>
                <Typography variant="body2" component="pre" sx={{ overflow: 'auto', p: 1, backgroundColor: '#f5f5f5' }}>
                  {this.state.error && this.state.error.toString()}
                  {this.state.errorInfo && this.state.errorInfo.componentStack}
                </Typography>
              </Box>
            )}
            <Button
              variant="contained"
              color="primary"
              onClick={this.handleReset}
              sx={{ mr: 2 }}
            >
              Try Again
            </Button>
            <Button
              variant="outlined"
              onClick={() => window.location.reload()}
            >
              Refresh Page
            </Button>
          </Paper>
        </Box>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
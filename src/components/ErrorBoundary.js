import React from 'react';
import './ErrorBoundary.css';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null, 
      errorInfo: null,
      errorId: null
    };
  }

  static getDerivedStateFromError(error) {
    // Error state'ini güncelle
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Error bilgilerini kaydet
    const errorId = `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    console.error('🚨 Error Boundary yakaladı:', error);
    console.error('📍 Error Info:', errorInfo);
    
    this.setState({
      error: error,
      errorInfo: errorInfo,
      errorId: errorId
    });

    // Production'da error reporting service'e gönder
    if (process.env.NODE_ENV === 'production') {
      this.reportError(error, errorInfo, errorId);
    }
  }

  reportError = (error, errorInfo, errorId) => {
    // Error reporting service integration
    // Örnek: Sentry, LogRocket, Bugsnag
    try {
      const errorReport = {
        errorId,
        message: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href,
        userId: this.props.userId || 'anonymous'
      };

      // LocalStorage'a geçici kaydet (network fail durumunda)
      const existingErrors = JSON.parse(localStorage.getItem('errorReports') || '[]');
      existingErrors.push(errorReport);
      localStorage.setItem('errorReports', JSON.stringify(existingErrors.slice(-10))); // Son 10 error

      console.log('📊 Error report saved:', errorReport);
    } catch (reportingError) {
      console.error('❌ Error reporting failed:', reportingError);
    }
  };

  handleReload = () => {
    window.location.reload();
  };

  handleGoBack = () => {
    window.history.back();
  };

  handleRetry = () => {
    this.setState({ 
      hasError: false, 
      error: null, 
      errorInfo: null,
      errorId: null 
    });
  };

  render() {
    if (this.state.hasError) {
      const isDevelopment = process.env.NODE_ENV === 'development';
      
      return (
        <div className="error-boundary">
          <div className="error-container">
            <div className="error-icon">
              🚨
            </div>
            
            <h1 className="error-title">
              Oops! Bir şeyler ters gitti
            </h1>
            
            <p className="error-description">
              Uygulamada beklenmeyen bir hata oluştu. Bu durumu düzeltmek için çalışıyoruz.
            </p>

            {isDevelopment && (
              <div className="error-details">
                <h3>🔍 Geliştirici Bilgileri:</h3>
                <div className="error-message">
                  <strong>Hata:</strong> {this.state.error && this.state.error.toString()}
                </div>
                {this.state.errorInfo && (
                  <div className="error-stack">
                    <strong>Stack Trace:</strong>
                    <pre>{this.state.errorInfo.componentStack}</pre>
                  </div>
                )}
              </div>
            )}

            <div className="error-actions">
              <button 
                onClick={this.handleRetry}
                className="error-btn primary"
              >
                🔄 Tekrar Dene
              </button>
              
              <button 
                onClick={this.handleGoBack}
                className="error-btn secondary"
              >
                ← Geri Git
              </button>
              
              <button 
                onClick={this.handleReload}
                className="error-btn secondary"
              >
                🔃 Sayfayı Yenile
              </button>
            </div>

            {this.state.errorId && (
              <div className="error-id">
                <small>Error ID: {this.state.errorId}</small>
              </div>
            )}

            <div className="error-footer">
              <p>
                Sorun devam ederse lütfen bizimle iletişime geçin: 
                <a href="mailto:support@solo-habits.com">support@solo-habits.com</a>
              </p>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
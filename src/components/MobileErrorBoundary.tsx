import React, { Component, ErrorInfo, ReactNode } from 'react';
import { PerfFlags } from '../perf/PerfFlags';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

export class MobileErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('🚨 Mobile Error Boundary caught error:', error);
    console.error('🚨 Error info:', errorInfo);
    
    this.setState({
      error,
      errorInfo
    });

    if (PerfFlags.isMobile) {
      console.error('🚨 MOBILE CRASH DETECTED');
      console.error('🚨 Device:', { 
        isIOS: PerfFlags.isIOS, 
        isMobile: PerfFlags.isMobile,
        memory: (navigator as any).deviceMemory || 'unknown',
        userAgent: navigator.userAgent.substring(0, 100)
      });
    }
  }

  handleReload = () => {
    window.location.reload();
  };

  handleContinue = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const isMobile = PerfFlags.isMobile;

      return (
        <div className="fixed inset-0 bg-gradient-to-b from-red-50 to-red-100 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-2xl p-6 max-w-md w-full">
            <div className="text-center">
              <div className="text-6xl mb-4">🚨</div>
              <h2 className="text-2xl font-bold text-red-600 mb-2">
                {isMobile ? 'Mobile Loading Error' : 'Scene Error'}
              </h2>
              <p className="text-gray-700 mb-4">
                {isMobile 
                  ? 'The 3D scene could not load on your device. This may be due to limited memory or WebGL restrictions.'
                  : 'An error occurred while loading the 3D scene.'}
              </p>

              {this.state.error && (
                <div className="bg-red-50 border border-red-200 rounded p-3 mb-4 text-left">
                  <p className="text-xs font-mono text-red-800 break-words">
                    {this.state.error.message}
                  </p>
                </div>
              )}

              <div className="space-y-2">
                <button
                  onClick={this.handleReload}
                  className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 px-4 rounded-lg transition"
                >
                  🔄 Reload Page
                </button>
                
                {isMobile && (
                  <button
                    onClick={this.handleContinue}
                    className="w-full bg-gray-500 hover:bg-gray-600 text-white font-semibold py-3 px-4 rounded-lg transition"
                  >
                    Continue Without 3D
                  </button>
                )}
              </div>

              {isMobile && (
                <div className="mt-4 text-xs text-gray-600">
                  <p className="mb-2">💡 <strong>Tip:</strong> For best mobile performance:</p>
                  <ul className="text-left list-disc list-inside space-y-1">
                    <li>Close other browser tabs</li>
                    <li>Restart your browser</li>
                    <li>Use latest iOS/Android version</li>
                    <li>View on desktop for full 3D experience</li>
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

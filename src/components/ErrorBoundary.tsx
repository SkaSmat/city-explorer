import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error to console or error reporting service
    console.error("ErrorBoundary caught an error:", error, errorInfo);

    this.setState({
      error,
      errorInfo,
    });

    // You can also log to an error reporting service here
    // Example: logErrorToService(error, errorInfo);
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  handleGoHome = () => {
    window.location.href = "/";
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default fallback UI
      return (
        <div className="min-h-screen flex items-center justify-center bg-background p-6">
          <div className="max-w-md w-full text-center space-y-6 animate-fade-in">
            {/* Error Icon */}
            <div className="w-20 h-20 mx-auto rounded-full bg-destructive/10 flex items-center justify-center">
              <AlertTriangle className="w-10 h-10 text-destructive" />
            </div>

            {/* Error Title */}
            <div className="space-y-2">
              <h1 className="text-2xl font-bold">Oups ! Une erreur s'est produite</h1>
              <p className="text-muted-foreground">
                Quelque chose s'est mal passé. Ne vous inquiétez pas, vos données sont en sécurité.
              </p>
            </div>

            {/* Error Details (only in development) */}
            {process.env.NODE_ENV === "development" && this.state.error && (
              <div className="bg-muted/50 rounded-xl p-4 text-left">
                <p className="text-xs font-mono text-destructive break-all">
                  {this.state.error.toString()}
                </p>
                {this.state.errorInfo && (
                  <details className="mt-2">
                    <summary className="text-xs text-muted-foreground cursor-pointer">
                      Stack trace
                    </summary>
                    <pre className="text-xs mt-2 text-muted-foreground whitespace-pre-wrap break-all">
                      {this.state.errorInfo.componentStack}
                    </pre>
                  </details>
                )}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                onClick={this.handleReset}
                className="flex-1 rounded-xl"
                size="lg"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Réessayer
              </Button>
              <Button
                onClick={this.handleGoHome}
                variant="outline"
                className="flex-1 rounded-xl"
                size="lg"
              >
                <Home className="w-4 h-4 mr-2" />
                Accueil
              </Button>
            </div>

            {/* Help Text */}
            <p className="text-xs text-muted-foreground">
              Si le problème persiste, essayez de rafraîchir la page ou contactez le support.
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

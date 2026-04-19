import { Component } from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';

export class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error('[ErrorBoundary]', error, info);
  }

  handleReset() {
    this.setState({ hasError: false, error: null });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen items-center justify-center p-6">
          <div className="text-center space-y-4 max-w-md">
            <AlertTriangle className="mx-auto h-12 w-12 text-destructive" />
            <h1 className="text-2xl font-bold">Algo salió mal</h1>
            <p className="text-muted-foreground text-sm">
              {this.state.error?.message || 'Error inesperado en la aplicación.'}
            </p>
            <div className="flex gap-2 justify-center">
              <Button onClick={() => this.handleReset()}>Intentar de nuevo</Button>
              <Button variant="outline" onClick={() => window.location.replace('/')}>
                Ir al inicio
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

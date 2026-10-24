import { Component, type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { useTheme } from '../ThemeProvider';
import { Button } from '../ui/Button';
import { AppText } from '../ui/Typography';
import { SPACING } from '../ui/layout';

const ERROR_TITLE = 'Bir şeyler ters gitti';
const ERROR_MESSAGE = 'Uygulama beklenmeyen bir hatayla karşılaştı. Tekrar denemek için aşağıdaki düğmeye dokun.';
const RETRY_LABEL = 'Tekrar dene';

interface ErrorFallbackProps {
  readonly onRetry: () => void;
}

function ErrorFallback({ onRetry }: ErrorFallbackProps) {
  const { colors } = useTheme();
  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]} testID="error-boundary-fallback">
      <AppText role="title" style={styles.title}>
        {ERROR_TITLE}
      </AppText>
      <AppText role="body" color={colors.textMuted} style={styles.message}>
        {ERROR_MESSAGE}
      </AppText>
      <Button label={RETRY_LABEL} onPress={onRetry} variant="primary" />
    </View>
  );
}

export interface ErrorBoundaryProps {
  readonly children: ReactNode;
}

interface ErrorBoundaryState {
  readonly hasError: boolean;
}

/**
 * Top-level render-error guard (MVP review issue 4): without it, an uncaught render error
 * white-screens the whole app instead of showing anything the player can act on. "Tekrar dene"
 * remounts the children by clearing hasError, which is enough for a transient render error (e.g.
 * a bad prop from a stale cache) but does not retry any network state by itself.
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  override state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  private handleRetry = (): void => {
    this.setState({ hasError: false });
  };

  override render(): ReactNode {
    if (this.state.hasError) return <ErrorFallback onRetry={this.handleRetry} />;
    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: SPACING.xxl, gap: SPACING.lg },
  title: { textAlign: 'center' },
  message: { textAlign: 'center' },
});

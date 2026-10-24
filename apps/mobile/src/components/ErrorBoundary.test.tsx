import { fireEvent, screen } from '@testing-library/react-native';
import { Text } from 'react-native';
import { renderWithTheme } from '../test-utils/render-with-theme';
import { ErrorBoundary } from './ErrorBoundary';

function Thrower(): never {
  throw new Error('boom');
}

describe('ErrorBoundary', () => {
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    // React logs the caught error to console.error on its own; this test is about the fallback
    // UI, not that log line, so it is silenced here rather than left to clutter the run.
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  it('should render children when nothing throws', async () => {
    await renderWithTheme(
      <ErrorBoundary>
        <Text>içerik</Text>
      </ErrorBoundary>,
    );
    expect(screen.getByText('içerik')).toBeTruthy();
  });

  it('should show the Turkish retry message instead of white-screening when a child throws', async () => {
    await renderWithTheme(
      <ErrorBoundary>
        <Thrower />
      </ErrorBoundary>,
    );
    expect(screen.getByTestId('error-boundary-fallback')).toBeTruthy();
    expect(screen.getByText('Bir şeyler ters gitti')).toBeTruthy();
    expect(screen.getByText('Tekrar dene')).toBeTruthy();
  });

  it('should retry rendering the children when "Tekrar dene" is pressed', async () => {
    let shouldThrow = true;
    function MaybeThrow() {
      if (shouldThrow) throw new Error('boom');
      return <Text>kurtarıldı</Text>;
    }

    await renderWithTheme(
      <ErrorBoundary>
        <MaybeThrow />
      </ErrorBoundary>,
    );
    shouldThrow = false;
    fireEvent.press(screen.getByText('Tekrar dene'));

    expect(await screen.findByText('kurtarıldı')).toBeTruthy();
  });
});

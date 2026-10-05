import '../global.css';
import { render } from '@testing-library/react-native';
import { View } from 'react-native';

describe('nativewind className', () => {
  it('should resolve className to a background style when rendered', async () => {
    const { getByTestId } = await render(<View testID="probe" className="bg-correct p-4" />);
    const probe = getByTestId('probe');
    expect(probe.props.style).toBeDefined();
  });
});

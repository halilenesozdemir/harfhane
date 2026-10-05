import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';
import { evaluateGuess, normalizeWord } from '@harfhane/shared';
import { deviceStore } from './src/game/device-store';
import { ThemeProvider, useTheme } from './src/ThemeProvider';

const PREVIEW_ANSWER = 'HARFH';
const PREVIEW_GUESS = 'harfi';
const TITLE_SIZE = 32;
const SECTION_GAP = 12;

function PreviewScreen() {
  const { colors, scheme } = useTheme();
  const evaluation = evaluateGuess(normalizeWord(PREVIEW_GUESS), PREVIEW_ANSWER);

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <Text style={[styles.title, { color: colors.text }]}>Harfhane</Text>
      <Text style={{ color: colors.textMuted }}>{evaluation.join(' ')}</Text>
      <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
    </View>
  );
}

export default function App() {
  return (
    <ThemeProvider store={deviceStore}>
      <PreviewScreen />
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: SECTION_GAP },
  title: { fontSize: TITLE_SIZE, fontWeight: '800' },
});

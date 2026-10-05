import { Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import { useTheme } from '../ThemeProvider';
import type { ThemePreference } from '../theme';

export interface SettingsScreenProps {
  readonly onClose: () => void;
}

interface ThemeOption {
  readonly value: ThemePreference;
  readonly label: string;
}

const THEME_OPTIONS: readonly ThemeOption[] = [
  { value: 'light', label: 'Açık Tema' },
  { value: 'dark', label: 'Koyu Tema' },
  { value: 'system', label: 'Sistem Ayarı' },
];

export function SettingsScreen({ onClose }: SettingsScreenProps) {
  const { colors, preference, setPreference, isHighContrast, setHighContrast } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <Text style={[styles.title, { color: colors.text }]}>Ayarlar</Text>

      <Text style={[styles.sectionTitle, { color: colors.text }]}>Tema</Text>
      <View style={styles.segmentedControl}>
        {THEME_OPTIONS.map((option) => (
          <ThemeSegment
            key={option.value}
            label={option.label}
            isActive={preference === option.value}
            onPress={() => setPreference(option.value)}
          />
        ))}
      </View>

      <View style={[styles.row, { backgroundColor: colors.surface }]}>
        <Text style={[styles.rowLabel, { color: colors.text }]}>Yüksek kontrast (renk körlüğü dostu)</Text>
        <Switch
          accessibilityLabel="Yüksek kontrast"
          value={isHighContrast}
          onValueChange={setHighContrast}
          trackColor={{ true: colors.brand, false: colors.surfaceBorder }}
        />
      </View>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Kapat"
        onPress={onClose}
        style={[styles.closeButton, { backgroundColor: colors.correct }]}
      >
        <Text style={[styles.closeLabel, { color: colors.correctFg }]}>Kapat</Text>
      </Pressable>
    </View>
  );
}

interface ThemeSegmentProps {
  readonly label: string;
  readonly isActive: boolean;
  readonly onPress: () => void;
}

function ThemeSegment({ label, isActive, onPress }: ThemeSegmentProps) {
  const { colors } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected: isActive }}
      onPress={onPress}
      style={[styles.segment, { backgroundColor: isActive ? colors.brand : colors.surface }]}
    >
      <Text style={[styles.segmentLabel, { color: isActive ? colors.brandFg : colors.text }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    gap: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  segmentedControl: {
    flexDirection: 'row',
    gap: 8,
  },
  segment: {
    flex: 1,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  segmentLabel: {
    fontSize: 13,
    fontWeight: '700',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 12,
    padding: 14,
  },
  rowLabel: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    marginRight: 12,
  },
  closeButton: {
    marginTop: 'auto',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  closeLabel: {
    fontSize: 16,
    fontWeight: '700',
  },
});

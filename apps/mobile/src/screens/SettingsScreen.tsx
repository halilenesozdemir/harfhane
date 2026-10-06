import { useCallback } from 'react';
import Constants from 'expo-constants';
import { Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import { useTheme } from '../ThemeProvider';
import { FONT_SIZE, RADIUS, SPACING } from '../ui/layout';
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
  const appVersion = Constants.expoConfig?.version;

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <Text style={[styles.title, { color: colors.text }]}>Ayarlar</Text>

      <Text style={[styles.sectionTitle, { color: colors.text }]}>Tema</Text>
      <View style={styles.segmentedControl}>
        {THEME_OPTIONS.map((option) => (
          <ThemeSegment
            key={option.value}
            value={option.value}
            label={option.label}
            isActive={preference === option.value}
            onSelect={setPreference}
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

      {appVersion ? (
        <Text style={[styles.version, { color: colors.textMuted }]}>Sürüm {appVersion}</Text>
      ) : null}
    </View>
  );
}

interface ThemeSegmentProps {
  readonly value: ThemePreference;
  readonly label: string;
  readonly isActive: boolean;
  readonly onSelect: (value: ThemePreference) => void;
}

function ThemeSegment({ value, label, isActive, onSelect }: ThemeSegmentProps) {
  const { colors } = useTheme();
  const handlePress = useCallback(() => onSelect(value), [onSelect, value]);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected: isActive }}
      onPress={handlePress}
      style={[styles.segment, { backgroundColor: isActive ? colors.brand : colors.surface }]}
    >
      <Text style={[styles.segmentLabel, { color: isActive ? colors.brandFg : colors.text }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: SPACING.xl,
    gap: SPACING.lg,
  },
  title: {
    fontSize: FONT_SIZE.title,
    fontWeight: '800',
  },
  sectionTitle: {
    fontSize: FONT_SIZE.bodyLarge,
    fontWeight: '700',
  },
  segmentedControl: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  segment: {
    flex: 1,
    borderRadius: RADIUS.md,
    paddingVertical: SPACING.md,
    alignItems: 'center',
  },
  segmentLabel: {
    fontSize: FONT_SIZE.body,
    fontWeight: '700',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: RADIUS.md,
    padding: SPACING.lg,
  },
  rowLabel: {
    flex: 1,
    fontSize: FONT_SIZE.body,
    fontWeight: '600',
    marginRight: SPACING.md,
  },
  closeButton: {
    marginTop: 'auto',
    borderRadius: RADIUS.lg,
    paddingVertical: SPACING.lg,
    alignItems: 'center',
  },
  closeLabel: {
    fontSize: FONT_SIZE.bodyLarge,
    fontWeight: '700',
  },
  version: {
    fontSize: FONT_SIZE.caption,
    textAlign: 'center',
  },
});

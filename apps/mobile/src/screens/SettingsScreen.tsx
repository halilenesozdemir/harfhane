import { ArrowLeft } from 'lucide-react-native';
import { useCallback, type ReactNode } from 'react';
import Constants from 'expo-constants';
import { Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import { useTheme } from '../ThemeProvider';
import { useHapticsSettings } from '../lib/useHapticsSettings';
import { IconButton } from '../ui/IconButton';
import { TopBar } from '../ui/TopBar';
import { FONT_SIZE, ICON_SIZE, RADIUS, SCREEN_PADDING, SPACING, TOUCH_TARGET } from '../ui/layout';
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
  const {
    isEnabled: isHapticsEnabled,
    isLoaded: isHapticsLoaded,
    setEnabled: setHapticsEnabled,
  } = useHapticsSettings();
  const appVersion = Constants.expoConfig?.version;

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <TopBar
        title="Ayarlar"
        leading={<IconButton icon={<ArrowLeft size={ICON_SIZE.lg} color={colors.text} />} accessibilityLabel="Geri" onPress={onClose} />}
      />
      <View style={styles.body}>
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
          <SettingsRow label="Tema" isFirst stacked borderColor={colors.surfaceBorder}>
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
          </SettingsRow>

          <SettingsRow label="Yüksek kontrast" caption="Renk körlüğü dostu renkler" borderColor={colors.surfaceBorder}>
            <Switch
              accessibilityLabel="Yüksek kontrast"
              value={isHighContrast}
              onValueChange={setHighContrast}
              trackColor={{ true: colors.brand, false: colors.surfaceBorder }}
            />
          </SettingsRow>

          <SettingsRow label="Titreşim" borderColor={colors.surfaceBorder}>
            <Switch
              accessibilityLabel="Titreşim"
              value={isHapticsEnabled}
              onValueChange={setHapticsEnabled}
              disabled={!isHapticsLoaded}
              trackColor={{ true: colors.brand, false: colors.surfaceBorder }}
            />
          </SettingsRow>
        </View>

        {appVersion ? (
          <Text style={[styles.version, { color: colors.textMuted }]}>Sürüm {appVersion}</Text>
        ) : null}
      </View>
    </View>
  );
}

interface SettingsRowProps {
  readonly label: string;
  readonly caption?: string;
  readonly isFirst?: boolean;
  readonly borderColor?: string;
  // Stacks the label above the children instead of side by side, so a wide
  // control (e.g. the three-way theme segmented control) keeps each option
  // at a readable width at narrow screen widths / large font scales.
  readonly stacked?: boolean;
  readonly children: ReactNode;
}

function SettingsRow({ label, caption, isFirst = false, borderColor, stacked = false, children }: SettingsRowProps) {
  const { colors } = useTheme();
  return (
    <View
      testID={`settings-row-${label}`}
      style={[
        styles.row,
        stacked && styles.rowStacked,
        !isFirst && borderColor ? { borderTopWidth: 1, borderTopColor: borderColor } : null,
      ]}
    >
      <View testID={`settings-row-${label}-text`} style={[styles.rowText, stacked && styles.rowTextStacked]}>
        <Text style={[styles.rowLabel, { color: colors.text }]}>{label}</Text>
        {caption ? <Text style={[styles.rowCaption, { color: colors.textMuted }]}>{caption}</Text> : null}
      </View>
      {children}
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
      style={[
        styles.segment,
        isActive
          ? { backgroundColor: colors.brand, borderColor: colors.brand }
          : { backgroundColor: colors.surface, borderColor: colors.surfaceBorder },
      ]}
    >
      <Text
        style={[styles.segmentLabel, { color: isActive ? colors.brandFg : colors.text }]}
        numberOfLines={1}
        adjustsFontSizeToFit
      >
        {label}
      </Text>
    </Pressable>
  );
}

const MIN_ROW_HEIGHT = 56;

const styles = StyleSheet.create({
  container: { flex: 1 },
  body: { flex: 1, paddingHorizontal: SCREEN_PADDING, paddingTop: SPACING.sm, paddingBottom: SCREEN_PADDING, gap: SPACING.lg },
  card: { borderRadius: RADIUS.lg, borderWidth: 1 },
  segmentedControl: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  segment: {
    flex: 1,
    minHeight: TOUCH_TARGET,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.xs,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentLabel: {
    fontSize: FONT_SIZE.body,
    fontWeight: '700',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: MIN_ROW_HEIGHT,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    gap: SPACING.md,
  },
  rowStacked: {
    flexDirection: 'column',
    alignItems: 'stretch',
  },
  rowText: { flex: 1, gap: SPACING.xs },
  // In a column, flex: 1 means a zero flex-basis: the label box would collapse and the text overlap the options.
  rowTextStacked: { flex: 0 },
  rowLabel: {
    fontSize: FONT_SIZE.body,
    fontWeight: '600',
  },
  rowCaption: {
    fontSize: FONT_SIZE.caption,
  },
  version: {
    fontSize: FONT_SIZE.caption,
    textAlign: 'center',
  },
});

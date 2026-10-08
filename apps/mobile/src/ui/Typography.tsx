import type { ComponentProps } from 'react';
import { Text } from 'react-native';
import { useTheme } from '../ThemeProvider';
import { FONT_FAMILY_DISPLAY, FONT_SIZE, LINE_HEIGHT } from './layout';

export type TextRole = 'display' | 'headline' | 'title' | 'titleSmall' | 'bodyLarge' | 'body' | 'caption';

export interface AppTextProps extends Omit<ComponentProps<typeof Text>, 'style' | 'role'> {
  readonly role: TextRole;
  readonly color?: string;
  /** Ignored for a Baloo 2 role (display/headline/title/titleSmall): a single-weight custom family combined with `fontWeight` picks the wrong Android face (T1). */
  readonly weight?: '400' | '700';
  readonly style?: ComponentProps<typeof Text>['style'];
}

const DISPLAY_FONT_ROLES: ReadonlySet<TextRole> = new Set(['display', 'headline', 'title', 'titleSmall']);

/** One role per card anatomy slot (CA3): fontSize/lineHeight from the typography table (section 2). */
export function AppText({ role, color, weight, style, children, ...rest }: AppTextProps) {
  const { colors } = useTheme();
  const isDisplayFont = DISPLAY_FONT_ROLES.has(role);

  return (
    <Text
      {...rest}
      style={[
        { fontSize: FONT_SIZE[role], lineHeight: LINE_HEIGHT[role], color: color ?? colors.text },
        isDisplayFont ? { fontFamily: FONT_FAMILY_DISPLAY } : weight ? { fontWeight: weight } : null,
        style,
      ]}
    >
      {children}
    </Text>
  );
}

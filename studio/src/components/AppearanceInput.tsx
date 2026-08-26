// studio/src/components/AppearanceInput.tsx
import { useCallback } from 'react'
import { Button, Card, Flex, Stack, Text, TextInput } from '@sanity/ui'
import { set, type ObjectInputProps } from 'sanity'
import { contrastRatio } from '../lib/contrast'

type ThemeKey = 'minimal' | 'professional'
type ThemeColorField = 'background' | 'text' | 'accent'
type ThemeColors = { background?: string; text?: string; accent?: string }
type AppearanceValue = {
  activeTheme?: ThemeKey
  minimal?: ThemeColors
  professional?: ThemeColors
}

const THEMES: { key: ThemeKey; title: string; headingFont: string }[] = [
  { key: 'minimal', title: 'Minimal', headingFont: 'system-ui, sans-serif' },
  { key: 'professional', title: 'Professional', headingFont: 'Georgia, serif' },
]

const DEFAULTS: Record<ThemeKey, Required<ThemeColors>> = {
  minimal: { background: '#fafafa', text: '#18181b', accent: '#6366f1' },
  professional: { background: '#f8f7f4', text: '#1a1a1a', accent: '#0f4c3a' },
}

const CONTRAST_WARNING_THRESHOLD = 4.5

function ColorField({
  label,
  value,
  onChange,
}: {
  label: string
  value: string
  onChange: (hex: string) => void
}) {
  return (
    <Stack gap={2}>
      <Text size={1} muted>
        {label}
      </Text>
      <Flex align="center" gap={2}>
        <input
          type="color"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          style={{ width: 40, height: 32, padding: 0, border: 'none', background: 'none', cursor: 'pointer' }}
        />
        <TextInput value={value} onChange={(event) => onChange(event.currentTarget.value)} style={{ width: 110 }} />
      </Flex>
    </Stack>
  )
}

export function AppearanceInput(props: ObjectInputProps) {
  const value = (props.value ?? {}) as AppearanceValue
  const activeTheme: ThemeKey = value.activeTheme ?? 'minimal'

  const handleActiveThemeChange = useCallback(
    (theme: ThemeKey) => {
      props.onChange(set(theme, ['activeTheme']))
    },
    [props],
  )

  const handleColorChange = useCallback(
    (theme: ThemeKey, field: ThemeColorField, hex: string) => {
      const resolved = { ...DEFAULTS[theme], ...value[theme], [field]: hex }
      props.onChange(set(resolved, [theme]))
    },
    [props, value],
  )

  return (
    <Stack gap={4}>
      <Card padding={3} radius={2} border>
        <Stack gap={3}>
          <Text weight="semibold">Active theme (live for every visitor)</Text>
          <Flex gap={2}>
            {THEMES.map((theme) => (
              <Button
                key={theme.key}
                text={theme.title}
                mode={activeTheme === theme.key ? 'default' : 'ghost'}
                onClick={() => handleActiveThemeChange(theme.key)}
              />
            ))}
          </Flex>
        </Stack>
      </Card>

      {THEMES.map((theme) => {
        const colors = { ...DEFAULTS[theme.key], ...value[theme.key] }
        const textContrast = contrastRatio(colors.text, colors.background)
        const accentContrast = contrastRatio(colors.accent, colors.background)

        return (
          <Card key={theme.key} padding={3} radius={2} border>
            <Stack gap={3}>
              <Text weight="semibold">{theme.title} colors</Text>
              <Flex gap={4} wrap="wrap">
                <ColorField
                  label="Background"
                  value={colors.background}
                  onChange={(hex) => handleColorChange(theme.key, 'background', hex)}
                />
                <ColorField
                  label="Text"
                  value={colors.text}
                  onChange={(hex) => handleColorChange(theme.key, 'text', hex)}
                />
                <ColorField
                  label="Accent"
                  value={colors.accent}
                  onChange={(hex) => handleColorChange(theme.key, 'accent', hex)}
                />
              </Flex>

              {textContrast < CONTRAST_WARNING_THRESHOLD && (
                <Card padding={2} radius={2} tone="caution">
                  <Text size={1}>
                    Low contrast between text and background ({textContrast.toFixed(2)}:1, WCAG recommends at least
                    4.5:1) — this text may be hard to read. You can still save this.
                  </Text>
                </Card>
              )}
              {accentContrast < CONTRAST_WARNING_THRESHOLD && (
                <Card padding={2} radius={2} tone="caution">
                  <Text size={1}>
                    Low contrast between accent and background ({accentContrast.toFixed(2)}:1) — accent elements may
                    be hard to see. You can still save this.
                  </Text>
                </Card>
              )}

              <div
                data-testid={`appearance-preview-${theme.key}`}
                style={{
                  background: colors.background,
                  color: colors.text,
                  padding: '1.5rem',
                  borderRadius: '0.75rem',
                  fontFamily: theme.headingFont,
                }}
              >
                <h3 style={{ margin: '0 0 0.5rem', fontSize: '1.25rem' }}>Preview heading</h3>
                <p style={{ margin: '0 0 0.75rem', fontFamily: 'system-ui, sans-serif' }}>
                  This is how paragraph text will look with the colors you&apos;ve picked.
                </p>
                <a
                  href="#"
                  onClick={(event) => event.preventDefault()}
                  style={{ color: colors.accent, marginRight: '1rem' }}
                >
                  A sample link
                </a>
                <button
                  type="button"
                  style={{
                    background: colors.accent,
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '999px',
                    padding: '0.5rem 1rem',
                    cursor: 'default',
                  }}
                >
                  Sample button
                </button>
              </div>
            </Stack>
          </Card>
        )
      })}
    </Stack>
  )
}

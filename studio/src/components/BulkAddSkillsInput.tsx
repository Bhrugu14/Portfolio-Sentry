// studio/src/components/BulkAddSkillsInput.tsx
import { useCallback, useState } from 'react'
import { Box, Button, Card, Stack, Text, TextArea } from '@sanity/ui'
import { insert, type ArrayOfObjectsInputProps } from 'sanity'

interface SkillItem {
  _key: string
  name?: string
}

/** Splits pasted/typed text on commas or newlines into trimmed, deduped
 * (case-insensitive) names, dropping anything empty. */
function parseNames(raw: string): string[] {
  const seen = new Set<string>()
  const names: string[] = []
  for (const part of raw.split(/[\n,]/)) {
    const name = part.trim()
    if (!name) continue
    const key = name.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    names.push(name)
  }
  return names
}

/** Augments the default array-of-objects input for `skillCategory.skills`
 * with a paste-a-list-and-go box, so adding a dozen skills doesn't mean a
 * dozen "add item" modals. Names only — an icon can still be added to any
 * individual skill afterward in the normal list rendered below this. */
export function BulkAddSkillsInput(props: ArrayOfObjectsInputProps) {
  const [text, setText] = useState('')
  const namesToAdd = parseNames(text)

  const handleAddAll = useCallback(() => {
    const existing = new Set(((props.value ?? []) as SkillItem[]).map((item) => (item.name ?? '').toLowerCase()))
    const names = parseNames(text).filter((name) => !existing.has(name.toLowerCase()))
    setText('')
    if (names.length === 0) return

    const items = names.map((name) => ({ _key: crypto.randomUUID(), _type: 'skill', name }))
    props.onChange(insert(items, 'after', [-1]))
  }, [props, text])

  return (
    <Stack gap={4}>
      <Card padding={3} radius={2} border>
        <Stack gap={3}>
          <Stack gap={2}>
            <Text weight="semibold" size={1}>
              Bulk add skills
            </Text>
            <Text size={1} muted>
              Paste or type names separated by commas or new lines, then Add All. Duplicates (by name) are skipped —
              add an icon to any skill afterward in the list below.
            </Text>
          </Stack>
          <TextArea
            rows={3}
            placeholder={'React, TypeScript, Node.js\n(or one per line)'}
            value={text}
            onChange={(event) => setText(event.currentTarget.value)}
          />
          <Box>
            <Button text="Add All" tone="primary" disabled={namesToAdd.length === 0} onClick={handleAddAll} />
          </Box>
        </Stack>
      </Card>
      {props.renderDefault(props)}
    </Stack>
  )
}

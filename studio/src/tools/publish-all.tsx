// studio/src/tools/publish-all.tsx
//
// A "Publish All" top-nav tool: lists every draft document in the dataset
// (any type) and publishes them in one click, reusing the same publish
// operation + validation hooks the document editor itself uses — so a
// document with validation errors is skipped and named in an error toast
// instead of silently failing or blocking the whole batch.
import { useCallback, useEffect, useRef, useState } from 'react'
import { Box, Button, Card, Flex, Heading, Spinner, Stack, Text } from '@sanity/ui'
import { useToast } from '@sanity/ui/toast'
import {
  useClient,
  useDocumentOperation as useDocumentOperationInternal,
  useValidationStatus as useValidationStatusInternal,
} from 'sanity'
import { PublishIcon } from '@sanity/icons/Publish'
import { RefreshIcon } from '@sanity/icons/Refresh'

const API_VERSION = '2024-01-01'

// useDocumentOperation/useValidationStatus are marked `@internal` by Sanity —
// their public .d.ts is blanked out (arity/`never`) even though the runtime
// export is the same one the document editor's own Publish button and
// validation badge use. Re-typed here to their real, documented shape.
const useDocumentOperation = useDocumentOperationInternal as unknown as (
  id: string,
  type: string
) => { publish: { disabled: false | string; execute: () => void } }

const useValidationStatus = useValidationStatusInternal as unknown as (
  id: string,
  type: string
) => { validation: { level: 'error' | 'warning' | 'info'; message: string }[] }

interface DraftDoc {
  id: string
  type: string
  title: string
}

interface DraftStatus {
  hasErrors: boolean
  errorMessages: string[]
  publishDisabled: boolean
  publish: () => void
}

/** One invisible worker per draft. Hooks can't run in a loop, so each draft
 * gets its own mounted instance that reports its live publish/validation
 * status up to the parent via a ref map. */
function DraftWorker({ doc, onStatus }: { doc: DraftDoc; onStatus: (id: string, status: DraftStatus) => void }) {
  const { publish } = useDocumentOperation(doc.id, doc.type)
  const { validation } = useValidationStatus(doc.id, doc.type)

  useEffect(() => {
    const errors = validation.filter((marker) => marker.level === 'error')
    onStatus(doc.id, {
      hasErrors: errors.length > 0,
      errorMessages: errors.map((e) => e.message),
      publishDisabled: Boolean(publish.disabled),
      publish: publish.execute,
    })
  }, [doc.id, validation, publish, onStatus])

  return null
}

export function PublishAllTool() {
  const client = useClient({ apiVersion: API_VERSION })
  const toast = useToast()
  const [drafts, setDrafts] = useState<DraftDoc[] | null>(null)
  const [publishing, setPublishing] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const statusRef = useRef(new Map<string, DraftStatus>())

  const refreshDrafts = useCallback(async () => {
    setRefreshing(true)
    const docs = await client.fetch<{ _id: string; _type: string; title: string }[]>(
      `*[_id in path("drafts.**")]{ _id, _type, "title": coalesce(title, name, role, _id) }`
    )
    setDrafts(docs.map((d) => ({ id: d._id.replace(/^drafts\./, ''), type: d._type, title: d.title })))
    setRefreshing(false)
  }, [client])

  useEffect(() => {
    refreshDrafts()
    // Only on mount — refreshDrafts is stable per client and re-running it
    // on every render would refetch on every keystroke elsewhere in Studio.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleStatus = useCallback((id: string, status: DraftStatus) => {
    statusRef.current.set(id, status)
  }, [])

  const handlePublishAll = useCallback(() => {
    if (!drafts) return
    setPublishing(true)

    const succeeded: string[] = []
    const succeededIds: string[] = []
    const failed: { title: string; reasons: string[] }[] = []

    for (const doc of drafts) {
      const status = statusRef.current.get(doc.id)
      if (!status || status.publishDisabled) continue
      if (status.hasErrors) {
        failed.push({ title: doc.title, reasons: status.errorMessages })
        continue
      }
      status.publish()
      succeeded.push(doc.title)
      succeededIds.push(doc.id)
    }

    // Optimistic: drop the ones we just published from the list right away
    // (their live `useDocumentOperation`/`useValidationStatus` status would
    // otherwise sit stale until something re-fetches) — this is what
    // actually deactivates "Publish All" once nothing's left. The Refresh
    // button below reconciles against the server for anything else.
    if (succeededIds.length > 0) {
      const publishedIds = new Set(succeededIds)
      setDrafts((prev) => prev?.filter((doc) => !publishedIds.has(doc.id)) ?? prev)
    }

    setPublishing(false)

    if (succeeded.length > 0) {
      toast.push({
        status: 'success',
        title: `Published ${succeeded.length} document${succeeded.length === 1 ? '' : 's'}`,
        description: succeeded.join(', '),
      })
    }
    if (failed.length > 0) {
      toast.push({
        status: 'error',
        title: `${failed.length} document${failed.length === 1 ? '' : 's'} could not be published`,
        description: (
          <Stack gap={2}>
            {failed.map((f) => (
              <Text key={f.title} size={1}>
                <strong>{f.title}:</strong> {f.reasons.join('; ')}
              </Text>
            ))}
          </Stack>
        ),
      })
    }
    if (succeeded.length === 0 && failed.length === 0) {
      toast.push({ status: 'info', title: 'Nothing to publish', description: 'No drafts had unpublished changes.' })
    }
  }, [drafts, toast])

  if (drafts === null) {
    return (
      <Flex align="center" justify="center" height="fill" padding={4}>
        <Spinner muted />
      </Flex>
    )
  }

  return (
    <Box padding={4}>
      {drafts.map((doc) => (
        <DraftWorker key={doc.id} doc={doc} onStatus={handleStatus} />
      ))}
      <Stack gap={4}>
        <Flex align="center" justify="space-between">
          <Heading size={2}>Publish All Drafts</Heading>
          <Button
            icon={RefreshIcon}
            text="Refresh"
            mode="ghost"
            disabled={refreshing || publishing}
            onClick={refreshDrafts}
          />
        </Flex>
        <Text muted size={1}>
          {drafts.length === 0
            ? 'No unpublished drafts right now.'
            : `${drafts.length} draft${drafts.length === 1 ? '' : 's'} found. Publishing skips anything with validation errors and reports which.`}
        </Text>
        {drafts.length > 0 && (
          <Card padding={3} radius={2} shadow={1}>
            <Stack gap={3}>
              {drafts.map((doc) => (
                <Flex key={doc.id} align="center" justify="space-between">
                  <Text size={1}>{doc.title}</Text>
                  <Text size={1} muted>
                    {doc.type}
                  </Text>
                </Flex>
              ))}
            </Stack>
          </Card>
        )}
        <Box>
          <Button
            text={publishing ? 'Publishing…' : 'Publish All'}
            tone="positive"
            disabled={drafts.length === 0 || publishing || refreshing}
            onClick={handlePublishAll}
          />
        </Box>
      </Stack>
    </Box>
  )
}

export const publishAllTool = {
  name: 'publish-all',
  title: 'Publish All',
  icon: PublishIcon,
  component: PublishAllTool,
}

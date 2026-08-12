import { describe, expect, it } from 'vitest'
import { buildResumeDownloadEvent } from './analytics-events'

describe('buildResumeDownloadEvent', () => {
  it('builds a resume_download event with file name and URL', () => {
    expect(buildResumeDownloadEvent('jane-doe-resume.pdf', 'https://cdn.sanity.io/files/x/y/resume.pdf')).toEqual({
      name: 'resume_download',
      params: {
        file_name: 'jane-doe-resume.pdf',
        link_url: 'https://cdn.sanity.io/files/x/y/resume.pdf',
      },
    })
  })
})

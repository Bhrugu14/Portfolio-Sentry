export type AnalyticsEvent = {
  name: 'resume_download'
  params: { file_name: string; link_url: string }
}

export function buildResumeDownloadEvent(fileName: string, url: string): AnalyticsEvent {
  return { name: 'resume_download', params: { file_name: fileName, link_url: url } }
}

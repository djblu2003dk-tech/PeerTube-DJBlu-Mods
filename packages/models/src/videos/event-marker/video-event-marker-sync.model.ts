export type VideoEventMarkerSyncProvider = 'api-football'

export interface VideoEventMarkerSync {
  enabled: boolean
  provider: VideoEventMarkerSyncProvider
  fixtureId?: string
  kickoffTime?: string
  kickoffTimecode?: number
  lastSyncAt?: string
  lastError?: string
}

import { VideoEventMarkerSyncProvider } from './video-event-marker-sync.model.js'

export interface VideoEventMarkerSyncUpdate {
  enabled?: boolean
  provider?: VideoEventMarkerSyncProvider
  fixtureId?: string
  kickoffTime?: string
  kickoffTimecode?: number
}

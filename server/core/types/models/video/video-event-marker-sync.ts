import { VideoEventMarkerSyncModel } from '@server/models/video/video-event-marker-sync.js'

export type MVideoEventMarkerSync = Omit<VideoEventMarkerSyncModel, 'Video'>
export type MVideoEventMarkerSyncFormattable = MVideoEventMarkerSync

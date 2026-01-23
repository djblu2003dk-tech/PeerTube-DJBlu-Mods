import { VideoEventMarkerModel } from '@server/models/video/video-event-marker.js'

export type MVideoEventMarker = Omit<VideoEventMarkerModel, 'Video'>

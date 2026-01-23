import express from 'express'
import { HttpStatusCode } from '@peertube/peertube-models'
import { asyncMiddleware, authenticate, videosCustomGetValidator } from '../../../middlewares/index.js'
import {
  createVideoEventMarkerValidator,
  deleteVideoEventMarkerValidator,
  listVideoEventMarkersValidator
} from '../../../middlewares/validators/index.js'
import { VideoEventMarkerModel } from '@server/models/video/video-event-marker.js'
import { VideoLiveSessionModel } from '@server/models/video/video-live-session.js'
import { PeerTubeSocket } from '@server/lib/peertube-socket.js'

const videoEventMarkersRouter = express.Router()

videoEventMarkersRouter.get(
  '/:id/event-markers',
  asyncMiddleware(videosCustomGetValidator('only-video-and-blacklist')),
  asyncMiddleware(listVideoEventMarkersValidator),
  asyncMiddleware(listVideoEventMarkers)
)

videoEventMarkersRouter.post(
  '/:videoId/event-markers',
  authenticate,
  asyncMiddleware(createVideoEventMarkerValidator),
  asyncMiddleware(createVideoEventMarker)
)

videoEventMarkersRouter.delete(
  '/:videoId/event-markers/:markerId',
  authenticate,
  asyncMiddleware(deleteVideoEventMarkerValidator),
  asyncMiddleware(deleteVideoEventMarker)
)

// ---------------------------------------------------------------------------

export {
  videoEventMarkersRouter
}

// ---------------------------------------------------------------------------

async function listVideoEventMarkers (req: express.Request, res: express.Response) {
  const video = res.locals.onlyVideo

  const markers = await VideoEventMarkerModel.listMarkersOfVideo(video.id)

  let liveStartAt: string = null
  if (video.isLive) {
    const liveSession = await VideoLiveSessionModel.findCurrentSessionOf(video.uuid)
    liveStartAt = liveSession?.startDate?.toISOString() || null
  }

  return res.json({
    markers: markers.map(m => m.toFormattedJSON()),
    liveStartAt
  })
}

async function createVideoEventMarker (req: express.Request, res: express.Response) {
  const video = res.locals.videoAll

  const marker = await VideoEventMarkerModel.create({
    videoId: video.id,
    timecode: Math.floor(req.body.timecode),
    type: req.body.type,
    label: req.body.label || null
  })

  PeerTubeSocket.Instance.sendVideoEventMarkersUpdated(video)

  return res.status(HttpStatusCode.CREATED_201).json({ marker: marker.toFormattedJSON() })
}

async function deleteVideoEventMarker (req: express.Request, res: express.Response) {
  const video = res.locals.videoAll
  const markerId = Number.parseInt(req.params.markerId, 10)

  await VideoEventMarkerModel.deleteMarker({ id: markerId, videoId: video.id })

  PeerTubeSocket.Instance.sendVideoEventMarkersUpdated(video)

  return res.sendStatus(HttpStatusCode.NO_CONTENT_204)
}

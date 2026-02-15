import express from 'express'
import { HttpStatusCode } from '@peertube/peertube-models'
import { asyncMiddleware, authenticate, videosCustomGetValidator } from '../../../middlewares/index.js'
import {
  createVideoEventMarkerValidator,
  deleteVideoEventMarkerValidator,
  listVideoEventMarkersValidator,
  updateVideoEventMarkerValidator,
  getVideoEventMarkerSyncValidator,
  updateVideoEventMarkerSyncValidator,
  deleteVideoEventMarkerSyncValidator,
  searchApiFootballTeamsValidator,
  listApiFootballFixturesValidator
} from '../../../middlewares/validators/index.js'
import { VideoEventMarkerModel } from '@server/models/video/video-event-marker.js'
import { VideoEventMarkerSyncModel } from '@server/models/video/video-event-marker-sync.js'
import { VideoLiveSessionModel } from '@server/models/video/video-live-session.js'
import { PeerTubeSocket } from '@server/lib/peertube-socket.js'
import { CONFIG } from '@server/initializers/config.js'
import { doJSONRequest } from '@server/helpers/requests.js'

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

videoEventMarkersRouter.put(
  '/:videoId/event-markers/:markerId',
  authenticate,
  asyncMiddleware(updateVideoEventMarkerValidator),
  asyncMiddleware(updateVideoEventMarker)
)

videoEventMarkersRouter.get(
  '/:videoId/event-markers/sync',
  authenticate,
  asyncMiddleware(getVideoEventMarkerSyncValidator),
  asyncMiddleware(getVideoEventMarkerSync)
)

videoEventMarkersRouter.put(
  '/:videoId/event-markers/sync',
  authenticate,
  asyncMiddleware(updateVideoEventMarkerSyncValidator),
  asyncMiddleware(updateVideoEventMarkerSync)
)

videoEventMarkersRouter.delete(
  '/:videoId/event-markers/sync',
  authenticate,
  asyncMiddleware(deleteVideoEventMarkerSyncValidator),
  asyncMiddleware(deleteVideoEventMarkerSync)
)

videoEventMarkersRouter.get(
  '/event-markers/teams',
  authenticate,
  searchApiFootballTeamsValidator,
  asyncMiddleware(searchApiFootballTeams)
)

videoEventMarkersRouter.get(
  '/event-markers/fixtures',
  authenticate,
  listApiFootballFixturesValidator,
  asyncMiddleware(listApiFootballFixtures)
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

async function updateVideoEventMarker (req: express.Request, res: express.Response) {
  const video = res.locals.videoAll
  const markerId = Number.parseInt(req.params.markerId, 10)

  const marker = await VideoEventMarkerModel.findOne({
    where: { id: markerId, videoId: video.id }
  })

  if (!marker) {
    return res.sendStatus(HttpStatusCode.NOT_FOUND_404)
  }

  if (req.body.timecode !== undefined) marker.timecode = Math.floor(req.body.timecode)
  if (req.body.type !== undefined) marker.type = req.body.type
  if (req.body.label !== undefined) marker.label = req.body.label || null

  await marker.save()

  PeerTubeSocket.Instance.sendVideoEventMarkersUpdated(video)

  return res.json({ marker: marker.toFormattedJSON() })
}

async function getVideoEventMarkerSync (req: express.Request, res: express.Response) {
  const video = res.locals.videoAll

  const sync = await VideoEventMarkerSyncModel.findOne({ where: { videoId: video.id } })

  return res.json({ sync: sync?.toFormattedJSON() || { enabled: false, provider: 'api-football' } })
}

async function updateVideoEventMarkerSync (req: express.Request, res: express.Response) {
  const video = res.locals.videoAll

  const [ sync ] = await VideoEventMarkerSyncModel.findOrCreate({
    where: { videoId: video.id },
    defaults: {
      enabled: false,
      provider: 'api-football'
    }
  })

  if (req.body.enabled !== undefined) sync.enabled = req.body.enabled
  if (req.body.provider !== undefined) sync.provider = req.body.provider
  if (req.body.fixtureId !== undefined) sync.fixtureId = req.body.fixtureId || null
  if (req.body.kickoffTime !== undefined) sync.kickoffTime = req.body.kickoffTime || null
  if (req.body.kickoffTimecode !== undefined) sync.kickoffTimecode = req.body.kickoffTimecode ?? null

  if (!sync.fixtureId || sync.kickoffTimecode === null || sync.kickoffTimecode === undefined) {
    sync.enabled = false
  }

  await sync.save()

  return res.json({ sync: sync.toFormattedJSON() })
}

async function deleteVideoEventMarkerSync (req: express.Request, res: express.Response) {
  const video = res.locals.videoAll

  await VideoEventMarkerSyncModel.destroy({ where: { videoId: video.id } })

  return res.sendStatus(HttpStatusCode.NO_CONTENT_204)
}

async function searchApiFootballTeams (req: express.Request, res: express.Response) {
  if (!CONFIG.API_THESPORTSDB.ENABLED) {
    return res.fail({ message: 'TheSportsDB is disabled' })
  }

  if (!CONFIG.API_THESPORTSDB.KEY) {
    return res.fail({ message: 'TheSportsDB key is missing' })
  }

  const search = String(req.query.search || '').trim()

  const { body } = await doJSONRequest<{ teams?: any[] }>(`${CONFIG.API_THESPORTSDB.BASE_URL}/${CONFIG.API_THESPORTSDB.KEY}/searchteams.php`, {
    preventSSRF: false,
    searchParams: { t: search },
    timeout: 15000,
    jsonResponse: true
  })

  const teams = (body?.teams || []).map(item => ({
    id: Number(item?.idTeam),
    name: item?.strTeam,
    country: item?.strCountry,
    logo: item?.strTeamBadge
  })).filter(t => t.id && t.name)

  return res.json({ teams })
}

async function listApiFootballFixtures (req: express.Request, res: express.Response) {
  if (!CONFIG.API_THESPORTSDB.ENABLED) {
    return res.fail({ message: 'TheSportsDB is disabled' })
  }

  if (!CONFIG.API_THESPORTSDB.KEY) {
    return res.fail({ message: 'TheSportsDB key is missing' })
  }

  const teamId = Number.parseInt(String(req.query.teamId), 10)
  const next = req.query.next ? Number.parseInt(String(req.query.next), 10) : 10
  const last = req.query.last ? Number.parseInt(String(req.query.last), 10) : 10

  const seasonParam = req.query.season ? Number.parseInt(String(req.query.season), 10) : null
  const fromParam = req.query.from ? String(req.query.from) : null
  const toParam = req.query.to ? String(req.query.to) : null

  const effectiveFrom = fromParam || (seasonParam ? `${seasonParam}-07-01` : null)
  const effectiveTo = toParam || (seasonParam ? `${seasonParam + 1}-06-30` : null)

  const buildEventDate = (item: any) => {
    const date = item?.dateEvent
    if (!date) return null

    const time = item?.strTime ? String(item.strTime).trim() : '00:00:00'
    const iso = `${date}T${time.endsWith('Z') ? time : time + 'Z'}`
    const parsed = new Date(iso)

    return Number.isNaN(parsed.getTime()) ? null : parsed
  }

  const mapEvent = (item: any) => {
    const date = buildEventDate(item)
    return {
      id: Number(item?.idEvent),
      date: date?.toISOString(),
      status: {
        short: item?.strStatus
      },
      league: {
        name: item?.strLeague,
        season: item?.strSeason
      },
      teams: {
        home: {
          id: item?.idHomeTeam ? Number(item.idHomeTeam) : undefined,
          name: item?.strHomeTeam
        },
        away: {
          id: item?.idAwayTeam ? Number(item.idAwayTeam) : undefined,
          name: item?.strAwayTeam
        }
      }
    }
  }

  const fetchEvents = async (endpoint: string, params: Record<string, string | number>) => {
    const { body } = await doJSONRequest<{ events?: any[] }>(`${CONFIG.API_THESPORTSDB.BASE_URL}/${CONFIG.API_THESPORTSDB.KEY}/${endpoint}`, {
      preventSSRF: false,
      searchParams: params,
      timeout: 15000,
      jsonResponse: true
    })

    return body?.events || []
  }

  let upcoming: any[] = []
  let recent: any[] = []

  if (seasonParam || effectiveFrom || effectiveTo) {
    const seasonString = seasonParam ? `${seasonParam}-${seasonParam + 1}` : undefined

    const events = await fetchEvents('eventsseason.php', {
      id: teamId,
      ...(seasonString ? { s: seasonString } : {})
    })

    const fromDate = effectiveFrom ? new Date(effectiveFrom + 'T00:00:00Z') : null
    const toDate = effectiveTo ? new Date(effectiveTo + 'T23:59:59Z') : null
    const now = new Date()

    for (const event of events) {
      const eventDate = buildEventDate(event)
      if (!eventDate) continue
      if (fromDate && eventDate < fromDate) continue
      if (toDate && eventDate > toDate) continue

      if (eventDate >= now) upcoming.push(event)
      else recent.push(event)
    }

    upcoming.sort((a, b) => buildEventDate(a).getTime() - buildEventDate(b).getTime())
    recent.sort((a, b) => buildEventDate(b).getTime() - buildEventDate(a).getTime())

    if (next > 0) upcoming = upcoming.slice(0, next)
    if (last > 0) recent = recent.slice(0, last)
  } else {
    const [ nextEvents, pastEvents ] = await Promise.all([
      next > 0 ? fetchEvents('eventsnext.php', { id: teamId }) : Promise.resolve([]),
      last > 0 ? fetchEvents('eventspast.php', { id: teamId }) : Promise.resolve([])
    ])

    upcoming = nextEvents
    recent = pastEvents
  }

  return res.json({
    upcoming: upcoming.map(mapEvent).filter(f => f.id),
    recent: recent.map(mapEvent).filter(f => f.id)
  })
}

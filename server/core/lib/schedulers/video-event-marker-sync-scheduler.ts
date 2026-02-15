import { VideoEventMarkerSyncModel } from '@server/models/video/video-event-marker-sync.js'
import { VideoEventMarkerModel } from '@server/models/video/video-event-marker.js'
import { VideoModel } from '@server/models/video/video.js'
import { logger, loggerTagsFactory } from '@server/helpers/logger.js'
import { CONFIG } from '@server/initializers/config.js'
import { AbstractScheduler } from './abstract-scheduler.js'
import { doJSONRequest } from '@server/helpers/requests.js'
import { SCHEDULER_INTERVALS_MS } from '@server/initializers/constants.js'
import { PeerTubeSocket } from '@server/lib/peertube-socket.js'
import type { VideoEventMarkerType } from '@peertube/peertube-models'

const lTags = loggerTagsFactory('schedulers', 'video-event-markers', 'api-football')

const EVENT_TYPE_MAP: Record<string, VideoEventMarkerType> = {
  'Kick Off': 'kickoff',
  'Half Time': 'half-time',
  'Full Time': 'full-time'
}

function buildExternalId (event: any) {
  const time = event?.time || {}
  const elapsed = time.elapsed ?? ''
  const extra = time.extra ?? ''
  const teamId = event?.team?.id ?? ''
  const playerId = event?.player?.id ?? ''
  const assistId = event?.assist?.id ?? ''
  const type = event?.type ?? ''
  const detail = event?.detail ?? ''
  return [ elapsed, extra, teamId, playerId, assistId, type, detail ].join('|')
}

function eventToMarkerType (event: any): VideoEventMarkerType | null {
  const type = event?.type
  const detail = event?.detail

  if (type === 'Goal') {
    if (detail === 'Penalty') return 'penalty'
    return 'goal'
  }

  if (type === 'Card') {
    if (detail?.toLowerCase().includes('yellow')) return 'yellow-card'
    if (detail?.toLowerCase().includes('red')) return 'red-card'
  }

  if (type === 'Match') {
    return EVENT_TYPE_MAP[detail] || null
  }

  return null
}

function eventToLabel (event: any) {
  const type = eventToMarkerType(event)
  const player = event?.player?.name
  const detail = event?.detail

  if (type === 'goal') {
    return `Goal${player ? ' - ' + player : ''}`
  }

  if (type === 'penalty') {
    return `Penalty${player ? ' - ' + player : ''}`
  }

  if (type === 'yellow-card') {
    return `Yellow card${player ? ' - ' + player : ''}`
  }

  if (type === 'red-card') {
    return `Red card${player ? ' - ' + player : ''}`
  }

  if (detail) return String(detail)
  if (player) return String(player)

  return undefined
}

function computeTimecode (kickoffTimecode: number, event: any) {
  const elapsed = Number(event?.time?.elapsed ?? 0)
  const extra = Number(event?.time?.extra ?? 0)
  if (!Number.isFinite(elapsed)) return null
  return Math.max(0, Math.floor(kickoffTimecode + (elapsed + extra) * 60))
}

export class VideoEventMarkerSyncScheduler extends AbstractScheduler {
  private static instance: AbstractScheduler
  protected schedulerIntervalMs = SCHEDULER_INTERVALS_MS.VIDEO_EVENT_MARKER_SYNC

  private constructor () {
    super({ randomRunOnEnable: true })
  }

  protected async internalExecute () {
    if (!CONFIG.API_FOOTBALL.ENABLED) {
      logger.debug('Discard API-Football sync as the feature is disabled', lTags())
      return
    }

    if (!CONFIG.API_FOOTBALL.KEY) {
      logger.warn('Discard API-Football sync because api_football.key is missing', lTags())
      return
    }

    const syncs = await VideoEventMarkerSyncModel.findAll({
      where: { enabled: true, provider: 'api-football' }
    })

    for (const sync of syncs) {
      await this.syncVideo(sync)
    }
  }

  private async syncVideo (sync: VideoEventMarkerSyncModel) {
    const video = await VideoModel.unscoped().findByPk(sync.videoId)
    if (!video) return
    if (!sync.fixtureId || sync.kickoffTimecode === null || sync.kickoffTimecode === undefined) return

    try {
      const events = await this.fetchFixtureEvents(sync.fixtureId)

      const desired = new Map<string, { timecode: number, type: VideoEventMarkerType, label?: string }>()
      for (const event of events) {
        const type = eventToMarkerType(event)
        if (!type) continue

        const timecode = computeTimecode(sync.kickoffTimecode, event)
        if (timecode === null) continue

        const externalId = buildExternalId(event)
        const label = eventToLabel(event)
        desired.set(externalId, { timecode, type, label })
      }

      const existing = await VideoEventMarkerModel.listMarkersByExternal({
        videoId: video.id,
        externalSource: 'api-football'
      })

      const existingByExternalId = new Map(existing.map(marker => [ marker.externalId, marker ]))
      let changed = false

      for (const [ externalId, payload ] of desired.entries()) {
        const marker = existingByExternalId.get(externalId)
        if (!marker) {
          await VideoEventMarkerModel.create({
            videoId: video.id,
            timecode: payload.timecode,
            type: payload.type,
            label: payload.label || null,
            externalSource: 'api-football',
            externalId
          })
          changed = true
          continue
        }

        let updated = false
        if (marker.timecode !== payload.timecode) {
          marker.timecode = payload.timecode
          updated = true
        }
        if (marker.type !== payload.type) {
          marker.type = payload.type
          updated = true
        }
        const nextLabel = payload.label || null
        if ((marker.label || null) !== nextLabel) {
          marker.label = nextLabel
          updated = true
        }

        if (updated) {
          await marker.save()
          changed = true
        }

        existingByExternalId.delete(externalId)
      }

      for (const marker of existingByExternalId.values()) {
        await marker.destroy()
        changed = true
      }

      sync.lastSyncAt = new Date()
      sync.lastError = null
      await sync.save()

      if (changed) {
        PeerTubeSocket.Instance.sendVideoEventMarkersUpdated(video)
      }
    } catch (err) {
      sync.lastError = String(err?.message || err)
      await sync.save()
      logger.warn('API-Football sync failed for video %s', video.uuid, { err, ...lTags() })
    }
  }

  private async fetchFixtureEvents (fixtureId: string) {
    const url = `${CONFIG.API_FOOTBALL.BASE_URL}/fixtures/events`

    const { body } = await doJSONRequest<{ response?: any[] }>(url, {
      preventSSRF: false,
      searchParams: { fixture: fixtureId },
      headers: {
        'x-apisports-key': CONFIG.API_FOOTBALL.KEY
      },
      timeout: 15000,
      jsonResponse: true
    })

    return body?.response || []
  }

  static get Instance () {
    return this.instance || (this.instance = new this())
  }
}

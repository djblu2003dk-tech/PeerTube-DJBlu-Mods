import { HttpClient } from '@angular/common/http'
import { Injectable, inject } from '@angular/core'
import { RestExtractor } from '@app/core'
import { VideoEventMarker, VideoEventMarkerCreate, VideoEventMarkerSync, VideoEventMarkerSyncUpdate, VideoEventMarkerUpdate } from '@peertube/peertube-models'
import { catchError } from 'rxjs/operators'
import { VideoPasswordService } from './video-password.service'
import { VideoService } from './video.service'

export type VideoEventMarkerListResponse = {
  markers: VideoEventMarker[]
  liveStartAt?: string
}

export type VideoEventMarkerSyncResponse = {
  sync: VideoEventMarkerSync
}

export type ApiFootballTeam = {
  id: number
  name: string
  country?: string
  logo?: string
}

export type ApiFootballFixture = {
  id: number
  date?: string
  status?: {
    long?: string
    short?: string
  }
  league?: {
    name?: string
    season?: number
    round?: string
  }
  teams?: {
    home?: {
      id?: number
      name?: string
    }
    away?: {
      id?: number
      name?: string
    }
  }
}

export type ApiFootballTeamsResponse = {
  teams: ApiFootballTeam[]
}

export type ApiFootballFixturesResponse = {
  upcoming: ApiFootballFixture[]
  recent: ApiFootballFixture[]
}

@Injectable()
export class VideoEventMarkerService {
  private authHttp = inject(HttpClient)
  private restExtractor = inject(RestExtractor)

  listMarkers (options: { videoId: string, videoPassword?: string }) {
    const headers = VideoPasswordService.buildVideoPasswordHeader(options.videoPassword)

    return this.authHttp.get<VideoEventMarkerListResponse>(`${VideoService.BASE_VIDEO_URL}/${options.videoId}/event-markers`, { headers })
      .pipe(catchError(err => this.restExtractor.handleError(err)))
  }

  createMarker (videoId: string, marker: VideoEventMarkerCreate) {
    return this.authHttp.post<{ marker: VideoEventMarker }>(`${VideoService.BASE_VIDEO_URL}/${videoId}/event-markers`, marker)
      .pipe(catchError(err => this.restExtractor.handleError(err)))
  }

  deleteMarker (options: { videoId: string, markerId: number }) {
    return this.authHttp.delete(`${VideoService.BASE_VIDEO_URL}/${options.videoId}/event-markers/${options.markerId}`)
      .pipe(catchError(err => this.restExtractor.handleError(err)))
  }

  updateMarker (options: { videoId: string, markerId: number, marker: VideoEventMarkerUpdate }) {
    return this.authHttp.put<{ marker: VideoEventMarker }>(`${VideoService.BASE_VIDEO_URL}/${options.videoId}/event-markers/${options.markerId}`, options.marker)
      .pipe(catchError(err => this.restExtractor.handleError(err)))
  }

  getSyncSettings (videoId: string) {
    return this.authHttp.get<VideoEventMarkerSyncResponse>(`${VideoService.BASE_VIDEO_URL}/${videoId}/event-markers/sync`)
      .pipe(catchError(err => this.restExtractor.handleError(err)))
  }

  updateSyncSettings (options: { videoId: string, sync: VideoEventMarkerSyncUpdate }) {
    return this.authHttp.put<VideoEventMarkerSyncResponse>(`${VideoService.BASE_VIDEO_URL}/${options.videoId}/event-markers/sync`, options.sync)
      .pipe(catchError(err => this.restExtractor.handleError(err)))
  }

  deleteSyncSettings (videoId: string) {
    return this.authHttp.delete(`${VideoService.BASE_VIDEO_URL}/${videoId}/event-markers/sync`)
      .pipe(catchError(err => this.restExtractor.handleError(err)))
  }

  searchTeams (search: string) {
    return this.authHttp.get<ApiFootballTeamsResponse>(`${VideoService.BASE_VIDEO_URL}/event-markers/teams`, {
      params: { search }
    }).pipe(catchError(err => this.restExtractor.handleError(err)))
  }

  listFixtures (options: { teamId: number, next?: number, last?: number, season?: number, from?: string, to?: string }) {
    return this.authHttp.get<ApiFootballFixturesResponse>(`${VideoService.BASE_VIDEO_URL}/event-markers/fixtures`, {
      params: {
        teamId: String(options.teamId),
        ...(options.season !== undefined ? { season: String(options.season) } : {}),
        ...(options.from ? { from: options.from } : {}),
        ...(options.to ? { to: options.to } : {}),
        ...(options.next !== undefined ? { next: String(options.next) } : {}),
        ...(options.last !== undefined ? { last: String(options.last) } : {})
      }
    }).pipe(catchError(err => this.restExtractor.handleError(err)))
  }
}

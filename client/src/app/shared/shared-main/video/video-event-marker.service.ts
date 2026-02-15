import { HttpClient } from '@angular/common/http'
import { Injectable, inject } from '@angular/core'
import { RestExtractor } from '@app/core'
import { VideoEventMarker, VideoEventMarkerCreate, VideoEventMarkerUpdate } from '@peertube/peertube-models'
import { catchError } from 'rxjs/operators'
import { VideoPasswordService } from './video-password.service'
import { VideoService } from './video.service'

export type VideoEventMarkerListResponse = {
  markers: VideoEventMarker[]
  liveStartAt?: string
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
}

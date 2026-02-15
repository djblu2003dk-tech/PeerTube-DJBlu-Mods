import { CommonModule } from '@angular/common'
import { Component, OnDestroy, OnInit, inject } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { ActivatedRoute, RouterLink } from '@angular/router'
import { AuthService, Notifier } from '@app/core'
import { TimestampInputComponent } from '@app/shared/shared-forms/timestamp-input.component'
import { DeleteButtonComponent } from '@app/shared/shared-main/buttons/delete-button.component'
import { TimeDurationFormatterPipe } from '@app/shared/shared-main/date/time-duration-formatter.pipe'
import { VideoEventMarkerService } from '@app/shared/shared-main/video/video-event-marker.service'
import { VideoService } from '@app/shared/shared-main/video/video.service'
import { VideoDetails } from '@app/shared/shared-main/video/video-details.model'
import { UserRight, VideoEventMarker, VideoEventMarkerSync, VideoEventMarkerType } from '@peertube/peertube-models'
import { Subscription, timer } from 'rxjs'
import { switchMap } from 'rxjs/operators'

interface EditableMarker extends VideoEventMarker {
  dirty?: boolean
  saving?: boolean
  original?: {
    timecode: number
    type: VideoEventMarkerType
    label?: string | null
  }
}

@Component({
  selector: 'my-video-event-markers-admin',
  templateUrl: './video-event-markers-admin.component.html',
  styleUrls: [ './video-event-markers-admin.component.scss' ],
  imports: [
    CommonModule,
    FormsModule,
    TimestampInputComponent,
    DeleteButtonComponent,
    TimeDurationFormatterPipe,
    RouterLink
  ]
})
export class VideoEventMarkersAdminComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute)
  private authService = inject(AuthService)
  private notifier = inject(Notifier)
  private videoService = inject(VideoService)
  private videoEventMarkerService = inject(VideoEventMarkerService)

  video: VideoDetails
  markers: EditableMarker[] = []

  newMarkerType: VideoEventMarkerType = 'goal'
  newMarkerTimecode = 0
  newMarkerLabel = ''

  loading = true
  accessError: string = null

  syncSettings: VideoEventMarkerSync = {
    enabled: false,
    provider: 'api-football'
  }

  syncFixtureId = ''
  syncKickoffTime = ''
  syncKickoffTimecode = 0

  private routeSub: Subscription
  private refreshSub: Subscription

  readonly fixtureLookupLink = [ '/videos/event-markers/fixtures' ]

  readonly eventMarkerTypes: { id: VideoEventMarkerType, label: string }[] = [
    { id: 'kickoff', label: $localize`Kick off` },
    { id: 'goal', label: $localize`Goal` },
    { id: 'penalty', label: $localize`Penalty` },
    { id: 'half-time', label: $localize`Half-time` },
    { id: 'red-card', label: $localize`Red card` },
    { id: 'yellow-card', label: $localize`Yellow card` },
    { id: 'full-time', label: $localize`Full-time` }
  ]

  ngOnInit () {
    this.routeSub = this.route.params.subscribe(params => {
      const videoId = params['videoId']
      if (videoId) this.loadVideo(videoId)
    })
  }

  ngOnDestroy () {
    this.routeSub?.unsubscribe()
    this.refreshSub?.unsubscribe()
  }

  private loadVideo (videoId: string) {
    this.loading = true
    this.accessError = null
    this.refreshSub?.unsubscribe()

    this.videoService.getVideo({ videoId }).subscribe({
      next: video => {
        this.video = video
        this.loading = false

        if (!this.canManageVideo()) {
          this.accessError = $localize`You do not have permission to manage event markers for this video.`
          return
        }

        this.loadSyncSettings(videoId)
        this.startAutoRefresh(videoId)
      },
      error: err => {
        this.loading = false
        this.notifier.error(err.message)
      }
    })
  }

  private loadSyncSettings (videoId: string) {
    this.videoEventMarkerService.getSyncSettings(videoId).subscribe({
      next: ({ sync }) => {
        this.syncSettings = sync || { enabled: false, provider: 'api-football' }
        this.syncFixtureId = this.syncSettings.fixtureId || ''
        this.syncKickoffTime = this.syncSettings.kickoffTime || ''
        this.syncKickoffTimecode = this.syncSettings.kickoffTimecode || 0
      },
      error: err => this.notifier.error(err.message)
    })
  }

  private canManageVideo () {
    const user = this.authService.getUser()
    if (!user) return false
    if (this.video?.isLocal !== true) return false

    if (user.hasRight(UserRight.UPDATE_ANY_VIDEO)) return true
    if (this.video?.channel && user.isOwnerOfChannel(this.video.channel)) return true

    return false
  }

  private startAutoRefresh (videoId: string) {
    this.refreshSub?.unsubscribe()

    this.refreshSub = timer(0, 10000)
      .pipe(switchMap(() => this.videoEventMarkerService.listMarkers({ videoId })))
      .subscribe({
        next: ({ markers }) => this.applyMarkers(markers),
        error: err => this.notifier.error(err.message)
      })
  }

  private applyMarkers (markers: VideoEventMarker[]) {
    const existingById = new Map<number, EditableMarker>()
    for (const marker of this.markers) existingById.set(marker.id, marker)

    this.markers = markers.map(marker => {
      const cleanLabel = marker.label || ''
      const existing = existingById.get(marker.id)
      if (existing?.dirty) {
        existing.original = {
          timecode: marker.timecode,
          type: marker.type,
          label: marker.label
        }
        return existing
      }

      return {
        ...marker,
        label: cleanLabel,
        dirty: false,
        saving: false,
        original: {
          timecode: marker.timecode,
          type: marker.type,
          label: marker.label
        }
      }
    })
  }

  markDirty (marker: EditableMarker) {
    marker.dirty = true
  }

  resetMarker (marker: EditableMarker) {
    if (!marker.original) return

    marker.timecode = marker.original.timecode
    marker.type = marker.original.type
    marker.label = marker.original.label || ''
    marker.dirty = false
  }

  addMarker () {
    if (!this.video) return

    this.videoEventMarkerService.createMarker(this.video.uuid, {
      timecode: Math.max(0, Math.floor(this.newMarkerTimecode || 0)),
      type: this.newMarkerType,
      label: this.newMarkerLabel || undefined
    }).subscribe({
      next: () => {
        this.newMarkerLabel = ''
        this.refreshOnce()
      },
      error: err => this.notifier.error(err.message)
    })
  }

  saveMarker (marker: EditableMarker) {
    if (!this.video || marker.saving) return

    marker.saving = true

    this.videoEventMarkerService.updateMarker({
      videoId: this.video.uuid,
      markerId: marker.id,
      marker: {
        timecode: Math.max(0, Math.floor(marker.timecode || 0)),
        type: marker.type,
        label: marker.label || undefined
      }
    }).subscribe({
      next: ({ marker: updated }) => {
        marker.timecode = updated.timecode
        marker.type = updated.type
        marker.label = updated.label || ''
        marker.dirty = false
        marker.saving = false
        marker.original = {
          timecode: updated.timecode,
          type: updated.type,
          label: updated.label
        }
      },
      error: err => {
        marker.saving = false
        this.notifier.error(err.message)
      }
    })
  }

  deleteMarker (marker: EditableMarker) {
    if (!this.video || marker.saving) return

    this.videoEventMarkerService.deleteMarker({ videoId: this.video.uuid, markerId: marker.id })
      .subscribe({
        next: () => this.refreshOnce(),
        error: err => this.notifier.error(err.message)
      })
  }

  private refreshOnce () {
    if (!this.video) return

    this.videoEventMarkerService.listMarkers({ videoId: this.video.uuid })
      .subscribe({
        next: ({ markers }) => this.applyMarkers(markers),
        error: err => this.notifier.error(err.message)
      })
  }

  saveSyncSettings () {
    if (!this.video) return

    this.videoEventMarkerService.updateSyncSettings({
      videoId: this.video.uuid,
      sync: {
        enabled: this.syncSettings.enabled,
        provider: 'api-football',
        fixtureId: this.syncFixtureId || undefined,
        kickoffTime: this.syncKickoffTime || undefined,
        kickoffTimecode: this.syncKickoffTimecode || 0
      }
    }).subscribe({
      next: ({ sync }) => {
        this.syncSettings = sync
        this.syncFixtureId = sync.fixtureId || ''
        this.syncKickoffTime = sync.kickoffTime || ''
        this.syncKickoffTimecode = sync.kickoffTimecode || 0
      },
      error: err => this.notifier.error(err.message)
    })
  }
}

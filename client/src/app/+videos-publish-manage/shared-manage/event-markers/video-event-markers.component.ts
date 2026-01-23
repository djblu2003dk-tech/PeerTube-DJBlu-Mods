import { CommonModule } from '@angular/common'
import { Component, OnInit, inject } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { VideoEventMarker, VideoEventMarkerType } from '@peertube/peertube-models'
import { VideoEventMarkerService } from '@app/shared/shared-main/video/video-event-marker.service'
import { TimestampInputComponent } from '../../../shared/shared-forms/timestamp-input.component'
import { DeleteButtonComponent } from '../../../shared/shared-main/buttons/delete-button.component'
import { VideoManageController } from '../video-manage-controller.service'
import { VideoEdit } from '../common/video-edit.model'
import { TimeDurationFormatterPipe } from '../../../shared/shared-main/date/time-duration-formatter.pipe'

@Component({
  selector: 'my-video-event-markers',
  templateUrl: './video-event-markers.component.html',
  styleUrls: [
    '../common/video-manage-page-common.scss',
    './video-event-markers.component.scss'
  ],
  imports: [
    CommonModule,
    FormsModule,
    TimestampInputComponent,
    DeleteButtonComponent,
    TimeDurationFormatterPipe
  ]
})
export class VideoEventMarkersComponent implements OnInit {
  private videoEventMarkerService = inject(VideoEventMarkerService)
  private manageController = inject(VideoManageController)

  videoEdit: VideoEdit
  markers: VideoEventMarker[] = []

  newMarkerType: VideoEventMarkerType = 'goal'
  newMarkerTimecode = 0
  newMarkerLabel = ''

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
    const { videoEdit } = this.manageController.getStore()
    this.videoEdit = videoEdit

    this.refreshMarkers()
  }

  refreshMarkers () {
    this.videoEventMarkerService.listMarkers({ videoId: this.videoEdit.getVideoAttributes().uuid })
      .subscribe(({ markers }) => {
        this.markers = markers
      })
  }

  addMarker () {
    if (!this.videoEdit) return

    this.videoEventMarkerService.createMarker(this.videoEdit.getVideoAttributes().uuid, {
      timecode: Math.max(0, Math.floor(this.newMarkerTimecode || 0)),
      type: this.newMarkerType,
      label: this.newMarkerLabel || undefined
    }).subscribe({
      next: () => {
        this.newMarkerLabel = ''
        this.refreshMarkers()
      }
    })
  }

  deleteMarker (marker: VideoEventMarker) {
    this.videoEventMarkerService.deleteMarker({ videoId: this.videoEdit.getVideoAttributes().uuid, markerId: marker.id })
      .subscribe(() => this.refreshMarkers())
  }
}

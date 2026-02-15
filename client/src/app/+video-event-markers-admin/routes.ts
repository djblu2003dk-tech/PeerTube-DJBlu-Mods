import { Routes } from '@angular/router'
import { LoginGuard } from '@app/core'
import { VideoEventMarkerFixtureSearchComponent } from './fixture-search/video-event-marker-fixture-search.component'
import { VideoEventMarkersAdminComponent } from './video-event-markers-admin.component'

export default [
  {
    path: ':videoId',
    component: VideoEventMarkersAdminComponent,
    canActivate: [ LoginGuard ],
    data: {
      meta: {
        title: $localize`Event markers`
      }
    }
  },
  {
    path: 'fixtures',
    component: VideoEventMarkerFixtureSearchComponent,
    canActivate: [ LoginGuard ],
    data: {
      meta: {
        title: $localize`Fixture lookup`
      }
    }
  }
] satisfies Routes

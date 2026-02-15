import { CommonModule } from '@angular/common'
import { Component, inject } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { RouterLink } from '@angular/router'
import { Notifier } from '@app/core'
import { ApiFootballFixture, ApiFootballTeam, VideoEventMarkerService } from '@app/shared/shared-main/video/video-event-marker.service'

@Component({
  selector: 'my-video-event-marker-fixture-search',
  templateUrl: './video-event-marker-fixture-search.component.html',
  styleUrls: [ './video-event-marker-fixture-search.component.scss' ],
  imports: [ CommonModule, FormsModule, RouterLink ]
})
export class VideoEventMarkerFixtureSearchComponent {
  private notifier = inject(Notifier)
  private videoEventMarkerService = inject(VideoEventMarkerService)

  searchQuery = ''
  teams: ApiFootballTeam[] = []
  selectedTeam: ApiFootballTeam = null

  upcoming: ApiFootballFixture[] = []
  recent: ApiFootballFixture[] = []

  loadingTeams = false
  loadingFixtures = false
  error: string = null

  season = 2024
  fromDate = '2024-07-01'
  toDate = '2025-06-30'
  limit = 10

  searchTeams () {
    const query = this.searchQuery.trim()
    if (query.length < 2) {
      this.notifier.error($localize`Please enter at least 2 characters.`)
      return
    }

    this.loadingTeams = true
    this.error = null
    this.selectedTeam = null
    this.upcoming = []
    this.recent = []

    this.videoEventMarkerService.searchTeams(query).subscribe({
      next: ({ teams }) => {
        this.teams = teams || []
        this.loadingTeams = false
        if (this.teams.length === 0) {
          this.notifier.info($localize`No teams found.`)
        }
      },
      error: err => {
        this.loadingTeams = false
        this.error = err.message
        this.notifier.error(err.message)
      }
    })
  }

  selectTeam (team: ApiFootballTeam) {
    this.selectedTeam = team
    this.fetchFixtures()
  }

  fetchFixtures () {
    if (!this.selectedTeam) return

    const seasonStartYear = this.season || 2025
    const defaultFrom = `${seasonStartYear}-07-01`
    const defaultTo = `${seasonStartYear + 1}-06-30`
    const from = this.fromDate || defaultFrom
    const to = this.toDate || defaultTo

    this.loadingFixtures = true
    this.error = null

    this.videoEventMarkerService.listFixtures({
      teamId: this.selectedTeam.id,
      season: this.season,
      from,
      to,
      next: this.limit,
      last: this.limit
    }).subscribe({
      next: ({ upcoming, recent }) => {
        this.upcoming = upcoming || []
        this.recent = recent || []
        this.loadingFixtures = false
      },
      error: err => {
        this.loadingFixtures = false
        this.error = err.message
        this.notifier.error(err.message)
      }
    })
  }

  async copyFixtureId (fixtureId: number) {
    try {
      await navigator.clipboard.writeText(String(fixtureId))
      this.notifier.success($localize`Fixture ID copied.`)
    } catch {
      this.notifier.error($localize`Unable to copy fixture ID.`)
    }
  }

  onSeasonChange () {
    const seasonStartYear = this.season || 2025
    this.fromDate = `${seasonStartYear}-07-01`
    this.toDate = `${seasonStartYear + 1}-06-30`
  }
}

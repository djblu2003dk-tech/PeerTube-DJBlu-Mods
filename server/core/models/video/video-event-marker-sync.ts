import { VideoEventMarkerSync } from '@peertube/peertube-models'
import { CONSTRAINTS_FIELDS } from '@server/initializers/constants.js'
import { MVideoEventMarkerSyncFormattable } from '@server/types/models/index.js'
import {
  AllowNull,
  BelongsTo,
  Column,
  CreatedAt,
  DataType,
  Default,
  ForeignKey,
  Is,
  Table,
  UpdatedAt
} from 'sequelize-typescript'
import { SequelizeModel } from '../shared/index.js'
import { VideoModel } from './video.js'

const ALLOWED_PROVIDERS = new Set([ 'api-football' ])

@Table({
  tableName: 'videoEventMarkerSync',
  indexes: [
    { fields: [ 'videoId' ], unique: true }
  ]
})
export class VideoEventMarkerSyncModel extends SequelizeModel<VideoEventMarkerSyncModel> {
  @AllowNull(false)
  @Default(false)
  @Column
  declare enabled: boolean

  @AllowNull(false)
  @Default('api-football')
  @Is('VideoEventMarkerSyncProvider', value => {
    if (!ALLOWED_PROVIDERS.has(value)) throw new Error('Invalid provider')
  })
  @Column(DataType.STRING(32))
  declare provider: string

  @AllowNull(true)
  @Column(DataType.STRING(128))
  declare fixtureId: string

  @AllowNull(true)
  @Column(DataType.STRING(8))
  declare kickoffTime: string

  @AllowNull(true)
  @Column(DataType.INTEGER)
  declare kickoffTimecode: number

  @AllowNull(true)
  @Column(DataType.DATE)
  declare lastSyncAt: Date

  @AllowNull(true)
  @Column(DataType.STRING(CONSTRAINTS_FIELDS.VIDEO_EVENT_MARKER_SYNC_LAST_ERROR.max))
  declare lastError: string

  @CreatedAt
  declare createdAt: Date

  @UpdatedAt
  declare updatedAt: Date

  @ForeignKey(() => VideoModel)
  @Column
  declare videoId: number

  @BelongsTo(() => VideoModel, {
    foreignKey: {
      allowNull: false,
      name: 'videoId'
    },
    onDelete: 'CASCADE'
  })
  declare Video: Awaited<VideoModel>

  toFormattedJSON (this: MVideoEventMarkerSyncFormattable): VideoEventMarkerSync {
    return {
      enabled: this.enabled,
      provider: this.provider as VideoEventMarkerSync['provider'],
      fixtureId: this.fixtureId || undefined,
      kickoffTime: this.kickoffTime || undefined,
      kickoffTimecode: this.kickoffTimecode ?? undefined,
      lastSyncAt: this.lastSyncAt?.toISOString(),
      lastError: this.lastError || undefined
    }
  }
}

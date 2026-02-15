import { VideoEventMarker, VideoEventMarkerType } from '@peertube/peertube-models'
import { MVideoEventMarker } from '@server/types/models/index.js'
import { AttributesOnly } from '@peertube/peertube-typescript-utils'
import { FindOptions, Transaction } from 'sequelize'
import {
  AllowNull,
  BelongsTo,
  Column,
  CreatedAt,
  DataType,
  ForeignKey,
  Table,
  UpdatedAt
} from 'sequelize-typescript'
import { SequelizeModel } from '../shared/index.js'
import { VideoModel } from './video.js'

@Table({
  tableName: 'videoEventMarker',
  indexes: [
    { fields: [ 'videoId' ] },
    { fields: [ 'videoId', 'timecode' ] }
  ]
})
export class VideoEventMarkerModel extends SequelizeModel<VideoEventMarkerModel> {
  @CreatedAt
  declare createdAt: Date

  @UpdatedAt
  declare updatedAt: Date

  @AllowNull(false)
  @Column(DataType.INTEGER)
  declare timecode: number

  @AllowNull(false)
  @Column(DataType.STRING(32))
  declare type: VideoEventMarkerType

  @AllowNull(true)
  @Column(DataType.STRING(200))
  declare label: string

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

  static listMarkersOfVideo (videoId: number, transaction?: Transaction) {
    const query: FindOptions<AttributesOnly<VideoEventMarkerModel>> = {
      where: { videoId },
      order: [ [ 'timecode', 'ASC' ], [ 'id', 'ASC' ] ],
      transaction
    }

    return VideoEventMarkerModel.findAll<MVideoEventMarker>(query)
  }

  static async deleteMarker (options: { id: number, videoId: number, transaction?: Transaction }) {
    const { id, videoId, transaction } = options

    return VideoEventMarkerModel.destroy({
      where: { id, videoId },
      transaction
    })
  }

  static async deleteMarkersOfVideo (videoId: number, transaction?: Transaction) {
    return VideoEventMarkerModel.destroy({
      where: { videoId },
      transaction
    })
  }

  toFormattedJSON (this: MVideoEventMarker): VideoEventMarker {
    return {
      id: this.id,
      timecode: this.timecode,
      type: this.type,
      label: this.label || undefined
    }
  }
}

import { DataTypes, QueryInterface } from 'sequelize'

export async function up (utils: { queryInterface: QueryInterface }) {
  const { queryInterface } = utils

  await queryInterface.addColumn('videoEventMarker', 'externalSource', {
    type: DataTypes.STRING(32),
    allowNull: true
  })

  await queryInterface.addColumn('videoEventMarker', 'externalId', {
    type: DataTypes.STRING(200),
    allowNull: true
  })

  await queryInterface.addIndex('videoEventMarker', [ 'externalSource', 'externalId' ])

  await queryInterface.createTable('videoEventMarkerSync', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    videoId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'video',
        key: 'id'
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
    },
    enabled: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    provider: {
      type: DataTypes.STRING(32),
      allowNull: false,
      defaultValue: 'api-football'
    },
    fixtureId: {
      type: DataTypes.STRING(128),
      allowNull: true
    },
    kickoffTime: {
      type: DataTypes.STRING(8),
      allowNull: true
    },
    kickoffTimecode: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    lastSyncAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    lastError: {
      type: DataTypes.STRING(500),
      allowNull: true
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false
    }
  })

  await queryInterface.addIndex('videoEventMarkerSync', [ 'videoId' ], { unique: true })
}

export async function down (utils: { queryInterface: QueryInterface }) {
  const { queryInterface } = utils

  await queryInterface.dropTable('videoEventMarkerSync')

  await queryInterface.removeIndex('videoEventMarker', [ 'externalSource', 'externalId' ])
  await queryInterface.removeColumn('videoEventMarker', 'externalId')
  await queryInterface.removeColumn('videoEventMarker', 'externalSource')
}

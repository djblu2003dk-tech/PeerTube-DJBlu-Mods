import { QueryInterface, DataTypes } from 'sequelize'

export async function up (utils: { queryInterface: QueryInterface }) {
  const { queryInterface } = utils

  await queryInterface.createTable('videoEventMarker', {
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
    timecode: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    type: {
      type: DataTypes.STRING(32),
      allowNull: false
    },
    label: {
      type: DataTypes.STRING(200),
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

  await queryInterface.addIndex('videoEventMarker', [ 'videoId' ])
  await queryInterface.addIndex('videoEventMarker', [ 'videoId', 'timecode' ])
}

export async function down (utils: { queryInterface: QueryInterface }) {
  const { queryInterface } = utils

  await queryInterface.dropTable('videoEventMarker')
}

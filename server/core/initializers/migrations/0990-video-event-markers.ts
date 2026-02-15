import { QueryInterface, DataTypes } from 'sequelize'

export async function up (utils: { queryInterface: QueryInterface }) {
  const { queryInterface } = utils

  const safeAddIndex = async (table: string, fields: string[]) => {
    try {
      await queryInterface.addIndex(table, fields)
    } catch (err) {
      if (err?.parent?.code === '42P07') return
      throw err
    }
  }

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

  await safeAddIndex('videoEventMarker', [ 'videoId' ])
  await safeAddIndex('videoEventMarker', [ 'videoId', 'timecode' ])
}

export async function down (utils: { queryInterface: QueryInterface }) {
  const { queryInterface } = utils

  await queryInterface.dropTable('videoEventMarker')
}

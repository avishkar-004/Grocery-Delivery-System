module.exports = (sequelize, DataTypes, uuidv4) => {
  const Category = sequelize.define('category', {
    id: {
      type: DataTypes.STRING(36),
      primaryKey: true,
      defaultValue: () => uuidv4()
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true
    },
    createdAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      field: 'created_at'
    },
    updatedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      field: 'updated_at'
    }
  }, {
    tableName: 'categories',
    timestamps: true,
    underscored: true
  });

  return Category;
};
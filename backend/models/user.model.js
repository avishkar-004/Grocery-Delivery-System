module.exports = (sequelize, DataTypes, uuidv4) => {
  const User = sequelize.define('user', {
    id: {
      type: DataTypes.STRING(36),
      primaryKey: true,
      defaultValue: () => uuidv4()
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        notEmpty: true
      }
    },
    email: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true
      }
    },
    password: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    phone: {
      type: DataTypes.STRING(20),
      allowNull: true
    },
    role: {
      type: DataTypes.ENUM('buyer', 'owner'),
      allowNull: false
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
    tableName: 'users',
    timestamps: true,
    underscored: true, // Use snake_case for the database column names
    defaultScope: {
      attributes: { exclude: ['password'] } // Don't return password by default
    },
    scopes: {
      withPassword: {
        attributes: { include: ['password'] }
      }
    }
  });

  return User;
};
module.exports = (sequelize, DataTypes, uuidv4) => {
  const Address = sequelize.define('address', {
    id: {
      type: DataTypes.STRING(36),
      primaryKey: true,
      defaultValue: () => uuidv4()
    },
    userId: {
      type: DataTypes.STRING(36),
      allowNull: false,
      field: 'user_id',
      references: {
        model: 'users',
        key: 'id'
      }
    },
    label: {
      type: DataTypes.STRING(50),
      allowNull: false
    },
    addressLine1: {
      type: DataTypes.STRING(255),
      allowNull: false,
      field: 'address_line1'
    },
    addressLine2: {
      type: DataTypes.STRING(255),
      allowNull: true,
      field: 'address_line2'
    },
    city: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    state: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    zipCode: {
      type: DataTypes.STRING(20),
      allowNull: false,
      field: 'zip_code'
    },
    isDefault: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      field: 'is_default'
    },
    latitude: {
      type: DataTypes.DECIMAL(10, 8),
      allowNull: true
    },
    longitude: {
      type: DataTypes.DECIMAL(11, 8),
      allowNull: true
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
    tableName: 'addresses',
    timestamps: true,
    underscored: true,
    hooks: {
      // Set as default address if it's the first one
      beforeCreate: async (address, options) => {
        const addressCount = await sequelize.models.address.count({
          where: { userId: address.userId }
        });
        if (addressCount === 0) {
          address.isDefault = true;
        }
      },
      // Make sure only one address is set as default
      afterSave: async (address, options) => {
        if (address.isDefault) {
          await sequelize.models.address.update(
            { isDefault: false },
            { 
              where: { 
                userId: address.userId,
                id: { [sequelize.Sequelize.Op.ne]: address.id }
              },
              transaction: options.transaction
            }
          );
        }
      }
    }
  });

  return Address;
};
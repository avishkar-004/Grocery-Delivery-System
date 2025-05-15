module.exports = (sequelize, DataTypes, uuidv4) => {
  const ShopProfile = sequelize.define('shopProfile', {
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
    shopName: {
      type: DataTypes.STRING(100),
      allowNull: false,
      field: 'shop_name'
    },
    shopDescription: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'shop_description'
    },
    shopAddress: {
      type: DataTypes.STRING(255),
      allowNull: false,
      field: 'shop_address'
    },
    shopCity: {
      type: DataTypes.STRING(100),
      allowNull: false,
      field: 'shop_city'
    },
    shopState: {
      type: DataTypes.STRING(100),
      allowNull: false,
      field: 'shop_state'
    },
    shopZipCode: {
      type: DataTypes.STRING(20),
      allowNull: false,
      field: 'shop_zip_code'
    },
    deliveryRadius: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 10,
      field: 'delivery_radius'
    },
    minimumOrder: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0,
      field: 'minimum_order'
    },
    openingTime: {
      type: DataTypes.TIME,
      allowNull: false,
      defaultValue: '08:00:00',
      field: 'opening_time'
    },
    closingTime: {
      type: DataTypes.TIME,
      allowNull: false,
      defaultValue: '20:00:00',
      field: 'closing_time'
    },
    rating: {
      type: DataTypes.DECIMAL(3, 1),
      allowNull: false,
      defaultValue: 0,
      field: 'rating'
    },
    reviewCount: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      field: 'review_count'
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
    tableName: 'shop_profiles',
    timestamps: true,
    underscored: true
  });

  return ShopProfile;
};
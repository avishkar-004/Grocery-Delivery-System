module.exports = (sequelize, DataTypes, uuidv4) => {
  const OrderItem = sequelize.define('orderItem', {
    id: {
      type: DataTypes.STRING(36),
      primaryKey: true,
      defaultValue: () => uuidv4()
    },
    orderId: {
      type: DataTypes.STRING(36),
      allowNull: false,
      field: 'order_id',
      references: {
        model: 'orders',
        key: 'id'
      }
    },
    productId: {
      type: DataTypes.STRING(36),
      allowNull: false,
      field: 'product_id',
      references: {
        model: 'products',
        key: 'id'
      }
    },
    productName: {
      type: DataTypes.STRING(100),
      allowNull: false,
      field: 'product_name'
    },
    productPrice: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      field: 'product_price'
    },
    quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1
    },
    itemTotal: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      field: 'item_total'
    },
    createdAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      field: 'created_at'
    }
  }, {
    tableName: 'order_items',
    timestamps: true,
    updatedAt: false,
    underscored: true,
    hooks: {
      // Automatically calculate item total
      beforeValidate: (orderItem) => {
        orderItem.itemTotal = orderItem.productPrice * orderItem.quantity;
      }
    }
  });

  return OrderItem;
};
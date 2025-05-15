module.exports = (sequelize, DataTypes, uuidv4) => {
  const Order = sequelize.define('order', {
    id: {
      type: DataTypes.STRING(36),
      primaryKey: true,
      defaultValue: () => uuidv4()
    },
    buyerId: {
      type: DataTypes.STRING(36),
      allowNull: false,
      field: 'buyer_id',
      references: {
        model: 'users',
        key: 'id'
      }
    },
    shopId: {
      type: DataTypes.STRING(36),
      allowNull: true,
      field: 'shop_id',
      references: {
        model: 'shop_profiles',
        key: 'id'
      }
    },
    totalAmount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      field: 'total_amount'
    },
    status: {
      type: DataTypes.ENUM('Placed', 'Accepted', 'Preparing', 'Out for Delivery', 'Delivered', 'Cancelled'),
      allowNull: false,
      defaultValue: 'Placed'
    },
    paymentMethod: {
      type: DataTypes.ENUM('Card', 'Cash', 'Wallet'),
      allowNull: false,
      field: 'payment_method'
    },
    addressId: {
      type: DataTypes.STRING(36),
      allowNull: false,
      field: 'address_id',
      references: {
        model: 'addresses',
        key: 'id'
      }
    },
    deliveryInstructions: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'delivery_instructions'
    },
    createdAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      field: 'created_at'
    },
    acceptedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'accepted_at'
    },
    preparedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'prepared_at'
    },
    outForDeliveryAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'out_for_delivery_at'
    },
    deliveredAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'delivered_at'
    },
    cancelledAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'cancelled_at'
    }
  }, {
    tableName: 'orders',
    timestamps: true,
    updatedAt: false,
    underscored: true,
    hooks: {
      // Update timestamp based on status change
      beforeUpdate: (order) => {
        if (order.changed('status')) {
          switch(order.status) {
            case 'Accepted':
              order.acceptedAt = new Date();
              break;
            case 'Preparing':
              order.preparedAt = new Date();
              break;
            case 'Out for Delivery':
              order.outForDeliveryAt = new Date();
              break;
            case 'Delivered':
              order.deliveredAt = new Date();
              break;
            case 'Cancelled':
              order.cancelledAt = new Date();
              break;
          }
        }
      }
    }
  });

  return Order;
};
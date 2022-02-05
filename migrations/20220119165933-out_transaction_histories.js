"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable("out_transaction_histories", {
      historyId: {
        type: Sequelize.DataTypes.BIGINT,
        autoIncrement: true,
        allowNull: false,
        primaryKey: true,
        unique: true,
      },
      historyUser: {
        type: Sequelize.DataTypes.UUID,
        references: {
          model: {
            tableName: "users",
          },
          key: "id",
        },
        allowNull: false,
        onDelete: "RESTRICT",
        onUpdate: "CASCADE",
      },
      id: {
        type: Sequelize.DataTypes.UUID,
        allowNull: false,
      },
      customer: {
        type: Sequelize.DataTypes.STRING,
        allowNull: false,
      },
      deliveryReceipt: {
        type: Sequelize.DataTypes.STRING,
      },
      dateOfDeliveryReceipt: {
        type: Sequelize.DataTypes.DATEONLY,
      },
      void: {
        type: Sequelize.DataTypes.BOOLEAN,
        allowNull: false,
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DataTypes.DATE,
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DataTypes.DATE,
      },
    });
    // await queryInterface.addIndex(
    //     'out_transactions',
    //     ['id', 'createdAt'],
    // );
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable("out_transaction_histories");
  },
};

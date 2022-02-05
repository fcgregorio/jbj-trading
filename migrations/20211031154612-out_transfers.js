"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable("out_transfers", {
      id: {
        type: Sequelize.DataTypes.UUID,
        defaultValue: Sequelize.DataTypes.UUIDV4,
        allowNull: false,
        primaryKey: true,
        unique: true,
      },
      quantity: {
        type: Sequelize.DataTypes.INTEGER,
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
      transaction: {
        type: Sequelize.DataTypes.UUID,
        references: {
          model: {
            tableName: "out_transactions",
          },
          key: "id",
        },
        allowNull: false,
        primaryKey: true,
        onDelete: "RESTRICT",
        onUpdate: "CASCADE",
      },
      item: {
        type: Sequelize.DataTypes.UUID,
        references: {
          model: {
            tableName: "items",
          },
          key: "id",
        },
        allowNull: false,
        primaryKey: true,
        onDelete: "RESTRICT",
        onUpdate: "CASCADE",
      },
    });
    await queryInterface.addIndex("out_transfers", ["transaction", "item"], {
      unique: true,
    });
    await queryInterface.addIndex("out_transfers", ["id", "createdAt"]);
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable("out_transfers");
  },
};

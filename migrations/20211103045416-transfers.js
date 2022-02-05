"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable("transfers", {
      id: {
        type: Sequelize.DataTypes.UUID,
        defaultValue: Sequelize.DataTypes.UUIDV4,
        allowNull: false,
        primaryKey: true,
        unique: true,
      },
      inTransfer: {
        type: Sequelize.DataTypes.UUID,
        references: {
          model: {
            tableName: "in_transfers",
          },
          key: "id",
        },
        allowNull: true,
        unique: true,
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
      },
      outTransfer: {
        type: Sequelize.DataTypes.UUID,
        references: {
          model: {
            tableName: "out_transfers",
          },
          key: "id",
        },
        allowNull: true,
        unique: true,
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
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
    await queryInterface.addIndex("transfers", ["id", "createdAt"]);
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable("transfers");
  },
};

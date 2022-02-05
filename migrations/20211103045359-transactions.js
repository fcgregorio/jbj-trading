"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable("transactions", {
      id: {
        type: Sequelize.DataTypes.UUID,
        defaultValue: Sequelize.DataTypes.UUIDV4,
        allowNull: false,
        primaryKey: true,
        unique: true,
      },
      inTransaction: {
        type: Sequelize.DataTypes.UUID,
        references: {
          model: {
            tableName: "in_transactions",
          },
          key: "id",
        },
        allowNull: true,
        unique: true,
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
      },
      outTransaction: {
        type: Sequelize.DataTypes.UUID,
        references: {
          model: {
            tableName: "out_transactions",
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
    await queryInterface.addIndex("transactions", ["id", "createdAt"]);
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable("transactions");
  },
};

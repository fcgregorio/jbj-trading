"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable("items", {
      id: {
        type: Sequelize.DataTypes.UUID,
        defaultValue: Sequelize.DataTypes.UUIDV4,
        allowNull: false,
        primaryKey: true,
        unique: true,
      },
      name: {
        type: Sequelize.DataTypes.STRING,
        allowNull: false,
        unique: true,
      },
      safetyStock: {
        type: Sequelize.DataTypes.INTEGER,
        allowNull: false,
      },
      stock: {
        type: Sequelize.DataTypes.INTEGER,
        allowNull: false,
      },
      remarks: {
        type: Sequelize.DataTypes.TEXT,
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
      deletedAt: {
        allowNull: true,
        type: Sequelize.DataTypes.DATE,
      },
      unit: {
        type: Sequelize.DataTypes.UUID,
        references: {
          model: {
            tableName: "units",
          },
          key: "id",
        },
        allowNull: false,
        onDelete: "RESTRICT",
        onUpdate: "CASCADE",
      },
      category: {
        type: Sequelize.DataTypes.UUID,
        references: {
          model: {
            tableName: "categories",
          },
          key: "id",
        },
        allowNull: false,
        onDelete: "RESTRICT",
        onUpdate: "CASCADE",
      },
    });
    await queryInterface.addIndex("items", ["id", "createdAt"]);
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable("items");
  },
};

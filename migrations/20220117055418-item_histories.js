"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable("item_histories", {
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
      name: {
        type: Sequelize.DataTypes.STRING,
        allowNull: false,
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
    // await queryInterface.addIndex(
    //     'items',
    //     ['id', 'createdAt'],
    // );
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable("item_histories");
  },
};

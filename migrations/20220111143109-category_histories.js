"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable("category_histories", {
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
    });
    // await queryInterface.addIndex(
    //     'categories',
    //     ['id', 'createdAt'],
    // );
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable("category_histories");
  },
};

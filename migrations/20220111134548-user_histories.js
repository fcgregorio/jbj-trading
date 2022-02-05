"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable("user_histories", {
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
      username: {
        type: Sequelize.DataTypes.STRING,
        allowNull: false,
      },
      firstName: {
        type: Sequelize.DataTypes.STRING,
        allowNull: false,
      },
      lastName: {
        type: Sequelize.DataTypes.STRING,
        allowNull: false,
      },
      password: {
        type: Sequelize.DataTypes.STRING,
        allowNull: false,
      },
      admin: {
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
      deletedAt: {
        allowNull: true,
        type: Sequelize.DataTypes.DATE,
      },
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable("user_histories");
  },
};

'use strict';

module.exports = {
    up: async (queryInterface, Sequelize) => {
        await queryInterface.createTable('users', {
            id: {
                type: Sequelize.DataTypes.UUID,
                defaultValue: Sequelize.DataTypes.UUIDV4,
                allowNull: false,
                primaryKey: true,
                unique: true,
            },
            username: {
                type: Sequelize.DataTypes.STRING,
                allowNull: false,
                unique: true,
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
                default: false,
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
                type: Sequelize.DataTypes.DATE
            },
        });
        await queryInterface.addIndex(
            'users',
            ['id', 'createdAt'],
        );
    },

    down: async (queryInterface, Sequelize) => {
        await queryInterface.dropTable('users');
    }
};

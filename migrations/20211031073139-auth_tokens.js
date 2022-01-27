'use strict';
module.exports = {
    up: async (queryInterface, Sequelize) => {
        await queryInterface.createTable('auth_tokens', {
            id: {
                type: Sequelize.DataTypes.UUID,
                defaultValue: Sequelize.DataTypes.UUIDV4,
                allowNull: false,
                primaryKey: true,
                unique: true,
            },
            createdAt: {
                allowNull: false,
                type: Sequelize.DataTypes.DATE,
            },
            updatedAt: {
                allowNull: false,
                type: Sequelize.DataTypes.DATE,
            },
            user: {
                type: Sequelize.DataTypes.UUID,
                references: {
                    model: {
                        tableName: 'users',
                    },
                    key: 'id',
                }, 
                allowNull: false,
                onDelete: 'CASCADE',
                onUpdate: 'CASCADE',
            },
        });
    },
    down: async (queryInterface, Sequelize) => {
        await queryInterface.dropTable('auth_tokens');
    }
};
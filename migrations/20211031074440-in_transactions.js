'use strict';
module.exports = {
    up: async (queryInterface, Sequelize) => {
        await queryInterface.createTable('in_transactions', {
            id: {
                type: Sequelize.DataTypes.UUID,
                defaultValue: Sequelize.DataTypes.UUIDV4,
                allowNull: false,
                primaryKey: true,
                unique: true,
            },
            supplier: {
                type: Sequelize.DataTypes.STRING,
                allowNull: false,
            },
            deliveryReceipt: {
                type: Sequelize.DataTypes.STRING,
            },
            dateOfDeliveryReceipt: {
                type: Sequelize.DataTypes.DATEONLY,
            },
            dateReceived: {
                type: Sequelize.DataTypes.DATEONLY,
            },
            void: {
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
        });
        await queryInterface.addIndex(
            'in_transactions',
            ['id', 'createdAt'],
        );
    },
    down: async (queryInterface, Sequelize) => {
        await queryInterface.dropTable('in_transactions');
    }
};
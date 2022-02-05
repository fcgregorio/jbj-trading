'use strict';

module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.changeColumn('in_transfers', 'index', Sequelize.DataTypes.INTEGER, {
            allowNull: false,
        });
        await queryInterface.addIndex(
            'in_transfers',
            ['transaction', 'index'],
            {
                unique: true,
            },
        );
        await queryInterface.changeColumn('out_transfers', 'index', Sequelize.DataTypes.INTEGER, {
            allowNull: false,
        });
        await queryInterface.addIndex(
            'out_transfers',
            ['transaction', 'index'],
            {
                unique: true,
            },
        );
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.changeColumn('in_transfers', 'index', Sequelize.DataTypes.INTEGER, {
            allowNull: true,
        });
        await queryInterface.removeIndex('in_transfers', ['transaction', 'index']);
        await queryInterface.changeColumn('in_transfers', 'index', Sequelize.DataTypes.INTEGER, {
            allowNull: true,
        });
        await queryInterface.removeIndex('out_transfers', ['transaction', 'index']);
    }
};

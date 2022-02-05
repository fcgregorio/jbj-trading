'use strict';

module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.addColumn('in_transfers', 'index', Sequelize.DataTypes.INTEGER, {
            allowNull: true,
        });
        await queryInterface.addColumn('out_transfers', 'index', Sequelize.DataTypes.INTEGER, {
            allowNull: true,
        });
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.removeColumn('in_transfers', 'index');
        await queryInterface.removeColumn('out_transfers', 'index');
    }
};

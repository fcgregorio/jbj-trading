'use strict';

module.exports = {
    up: async (queryInterface, Sequelize) => {
        const date = new Date("2000-01-01T00:00:00+0800");
        await queryInterface.bulkInsert('categories', [
            {
                id: 'd183c5c9-2049-4907-93c4-d9667846b685',
                name: 'Aggregates',
                createdAt: date,
                updatedAt: date,
            },
            {
                id: '731167c9-0a6f-4f79-82e1-a9f73abe9485',
                name: 'Wood',
                createdAt: date,
                updatedAt: date,
            },
            {
                id: '6544d389-dd80-4cf9-840c-aab63554fc5b',
                name: 'Steel Bars',
                createdAt: date,
                updatedAt: date,
            },
            {
                id: 'cb446964-6545-4f5a-90ef-8c9e660a174f',
                name: 'GI Sheet',
                createdAt: date,
                updatedAt: date,
            },
            {
                id: 'c15218ac-0502-4e38-aa80-e12ffc753764',
                name: 'Cement',
                createdAt: date,
                updatedAt: date,
            },
            {
                id: '0f55f77b-5686-466d-b767-1d391df33c30',
                name: 'GI Pipes',
                createdAt: date,
                updatedAt: date,
            },
            {
                id: 'fa880e48-e13c-4898-8ecb-0402b002ea04',
                name: 'PVC Pipes',
                createdAt: date,
                updatedAt: date,
            },
            {
                id: '5c907b29-e249-4168-9971-c3af8fa0bfe5',
                name: 'Nails',
                createdAt: date,
                updatedAt: date,
            },
            {
                id: '150cbe43-5052-4662-b1e8-a960981c6d63',
                name: 'Container',
                createdAt: date,
                updatedAt: date,
            },
            {
                id: 'ab0b6119-852b-4506-a47e-71324c3027e0',
                name: 'Paints',
                createdAt: date,
                updatedAt: date,
            },
            {
                id: '294b61b0-92fb-4b9d-bce3-5ebd6f7bd09a',
                name: 'Various',
                createdAt: date,
                updatedAt: date,
            },
            {
                id: 'a4764ad0-9467-4c52-9704-d83fecdf7c67',
                name: 'Welding Rod',
                createdAt: date,
                updatedAt: date,
            },
            {
                id: '437b7ce6-c926-47bb-a516-00d06c69bd66',
                name: 'Plywood',
                createdAt: date,
                updatedAt: date,
            },
            {
                id: 'f31c99ad-f45f-4341-9070-b3250b7cc988',
                name: 'Blue Pipes',
                createdAt: date,
                updatedAt: date,
            },
            {
                id: 'dd8c1da3-ca81-4b3c-8888-441d6ba53fbc',
                name: 'Conduit Pipes',
                createdAt: date,
                updatedAt: date,
            },
            {
                id: '619c1b6c-7331-4864-81d2-f805ab2261a2',
                name: 'HDPE Pipes SDR 11',
                createdAt: date,
                updatedAt: date,
            },
            {
                id: '2477ce3f-870a-4c83-935b-22ee6ce39425',
                name: 'PPR Pipe PN20',
                createdAt: date,
                updatedAt: date,
            },
            {
                id: '676bb175-708d-43f7-82e2-b7501867f075',
                name: 'Bostik',
                createdAt: date,
                updatedAt: date,
            },
            {
                id: '677c5b21-31a5-44b7-989e-509a0df35c51',
                name: 'Electrical',
                createdAt: date,
                updatedAt: date,
            },
            {
                id: '65ca3071-54c3-4b44-86ae-b5992b192a4f',
                name: 'Stainless',
                createdAt: date,
                updatedAt: date,
            },
            {
                id: '324400ac-ee24-4b47-b588-781b267ffd32',
                name: 'Lubricant',
                createdAt: date,
                updatedAt: date,
            },
        ], {
            validate: true,
        });
    },

    down: async (queryInterface, Sequelize) => {
        await queryInterface.bulkDelete('categories', null, {});
    }
};

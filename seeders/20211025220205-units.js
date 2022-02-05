"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const date = new Date("2000-01-01T00:00:00+0800");
    await queryInterface.bulkInsert(
      "units",
      [
        {
          id: "ebaf3512-64ec-455b-9cb3-1832a281da8c",
          name: "bags",
          createdAt: date,
          updatedAt: date,
        },
        {
          id: "7d42789c-24a0-4a73-abd6-26583c80b2a7",
          name: "pcs",
          createdAt: date,
          updatedAt: date,
        },
        {
          id: "b1903239-98d7-4796-9a44-b096915d155c",
          name: "tnr",
          createdAt: date,
          updatedAt: date,
        },
        {
          id: "5ab04ef3-b5b7-499b-9cf6-36ceaa8dfb22",
          name: "bxs",
          createdAt: date,
          updatedAt: date,
        },
        {
          id: "4ef18cb2-6dfc-473e-af94-b0abcad857a8",
          name: "pails",
          createdAt: date,
          updatedAt: date,
        },
        {
          id: "61c63082-3409-43ea-892f-2e1b151663e1",
          name: "rlls",
          createdAt: date,
          updatedAt: date,
        },
        {
          id: "fbb00f6c-ad31-44c2-b67b-2b544c3614ba",
          name: "set",
          createdAt: date,
          updatedAt: date,
        },
        {
          id: "ecf9b653-3362-4cc9-b2e1-657641d4e29a",
          name: "kgs",
          createdAt: date,
          updatedAt: date,
        },
        {
          id: "031b89b6-0924-4b82-a012-baf136f81a32",
          name: "sack",
          createdAt: date,
          updatedAt: date,
        },
        {
          id: "47b885b1-0100-4c6a-98d7-09236ef1b50e",
          name: "pairs",
          createdAt: date,
          updatedAt: date,
        },
        {
          id: "e99bcef2-10e5-41af-acdb-a35e684b8653",
          name: "Ltrs",
          createdAt: date,
          updatedAt: date,
        },
        {
          id: "8373b274-f772-467a-a689-c9b4fa300a21",
          name: "Btl",
          createdAt: date,
          updatedAt: date,
        },
        {
          id: "d95c3db4-d69e-4d04-9aad-5536911a9f32",
          name: "Gal",
          createdAt: date,
          updatedAt: date,
        },
      ],
      {
        validate: true,
      }
    );
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete("units", null, {});
  },
};

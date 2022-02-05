"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const date = new Date("2000-01-01T00:00:00+0800");
    await queryInterface.bulkInsert(
      "users",
      [
        {
          id: "d85cbda0-61d1-4c17-aaa5-1b2dc0f73b86",
          username: "regular",
          firstName: "Reg",
          lastName: "Ular",
          password:
            "58694147-0511-4f1a-ad33-64435b002081$743faf0e46f6f8a3fa80e24914be9fc12e727a57a29ca2a497d12285a7e0c095430e6b1120b11b4911b70cede5e58a7f3046a4857245b7ff31a9ae6bc0f12a22",
          admin: false,
          createdAt: date,
          updatedAt: date,
        },
        {
          id: "d85cbda0-61d1-4c17-aaa5-1b2dc0f73b87",
          username: "admin",
          firstName: "Ad",
          lastName: "min",
          password:
            "34dedd7b-fd89-475b-9f24-178aabe1d685$922af7d4963efa0f05acb76f61686a289e7e9cf8c80e2ee304d5ed54988ed32f32fb1555b9a15b1b338f149457ce41b1fbe0bedf5c6eb6e88b76a6a6fc097626",
          admin: true,
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
    await queryInterface.bulkDelete("users", null, {});
  },
};

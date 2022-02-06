import excel from "exceljs";
import { NextFunction, Request, Response, Router } from "express";
import { DateTime } from "luxon";
import { literal, Op, QueryTypes } from "sequelize";
import tmp from "tmp";
import {
  adminRequiredMiddleware,
  loginRequiredMiddleware,
} from "../../middleware/auth";
import sequelize, {
  Category,
  InTransaction,
  InTransfer,
  Item,
  OutTransaction,
  OutTransfer,
  Transaction,
  Transfer,
  Unit,
} from "../../sequelize";

const router = Router();
router.use(loginRequiredMiddleware);

router.get(
  "/",
  async function (req: Request, res: Response, next: NextFunction) {
    try {
      let whereAnd: any[] = [];
      whereAnd.push({
        [Op.or]: [
          literal("`InTransaction.id` IS NOT NULL"),
          literal("`OutTransaction.id` IS NOT NULL"),
        ],
      });

      let countQueryWhere = ``;
      let countQueryInTransactionJoin = ``;
      let countQueryOutTransactionJoin = ``;
      let countQueryReplacements = {};

      const dateQuery = req.query.date as string;
      if (dateQuery !== undefined) {
        const date = DateTime.fromISO(dateQuery, {
          setZone: true,
        });
        if (!date.isValid) {
          res.status(400).send("Invalid date");
          return;
        } else {
          countQueryWhere =
            countQueryWhere +
            `(
                        'Transaction'.'createdAt' >= :startDate
                        AND
                        'Transaction'.'createdAt' <= :endDate
                    )`;
          countQueryReplacements = {
            ...countQueryReplacements,
            startDate: date
              .startOf("day")
              .setZone("utc")
              .toFormat("yyyy-LL-dd HH:mm:ss ZZ"),
            endDate: date
              .endOf("day")
              .setZone("utc")
              .toFormat("yyyy-LL-dd HH:mm:ss ZZ"),
          };

          whereAnd.push({
            createdAt: {
              [Op.gte]: date.startOf("day").toJSDate(),
              [Op.lte]: date.endOf("day").toJSDate(),
            },
          });
        }
      }

      let whereInTransactionAnd: any[] = [];
      let whereOutTransactionAnd: any[] = [];
      const searchQuery = req.query.search as string;
      if (searchQuery !== undefined && searchQuery !== "") {
        countQueryInTransactionJoin =
          countQueryInTransactionJoin +
          `
                    AND 'InTransaction'.'supplier' LIKE :searchQuery
                `;
        countQueryOutTransactionJoin =
          countQueryOutTransactionJoin +
          `
                    AND 'OutTransaction'.'customer' LIKE :searchQuery
                `;
        countQueryReplacements = {
          ...countQueryReplacements,
          searchQuery: `%${searchQuery}%`,
        };

        whereInTransactionAnd.push({
          supplier: {
            [Op.like]: `%${searchQuery}%`, // TODO
          },
        });
        whereOutTransactionAnd.push({
          customer: {
            [Op.like]: `%${searchQuery}%`, // TODO
          },
        });
      }

      const count = await sequelize.query(
        `SELECT
                (count('InTransaction'.'id') + count('OutTransaction'.'id')) AS 'count'
            FROM
                'transactions' AS 'Transaction'
            LEFT OUTER JOIN 'in_transactions' AS 'InTransaction'
                ON 'Transaction'.'inTransaction' = 'InTransaction'.'id'
                ${countQueryInTransactionJoin}
            LEFT OUTER JOIN 'out_transactions' AS 'OutTransaction'
                ON 'Transaction'.'outTransaction' = 'OutTransaction'.'id'
                ${countQueryOutTransactionJoin}
            WHERE ${countQueryWhere}
            ;`,
        {
          type: QueryTypes.SELECT,
          replacements: countQueryReplacements,
          raw: true,
        }
      );

      const cursorQuery = req.query.cursor as string;
      if (cursorQuery !== undefined) {
        const cursor = await Transaction.findByPk(cursorQuery, {
          attributes: ["id", "createdAt"],
          rejectOnEmpty: true,
        });

        whereAnd.push({
          [Op.or]: [
            {
              createdAt: {
                [Op.lt]: cursor.createdAt,
              },
            },
            {
              [Op.and]: [
                {
                  createdAt: cursor.createdAt,
                },
                {
                  id: {
                    [Op.lt]: cursor.id,
                  },
                },
              ],
            },
          ],
        });
      }

      const results = await Transaction.findAll({
        include: [
          {
            model: InTransaction,
            required: false,
            where: {
              [Op.and]: whereInTransactionAnd,
            },
          },
          {
            model: OutTransaction,
            required: false,
            where: {
              [Op.and]: whereOutTransactionAnd,
            },
          },
        ],
        where: {
          [Op.and]: whereAnd,
        },
        order: [
          ["createdAt", "DESC"],
          ["id", "DESC"],
        ],
        limit: 100,
      });

      res.status(200).json({
        count: (count[0] as any).count,
        results: results,
      });
    } catch (error: any) {
      next(error);
    }
  }
);

router.get(
  "/export",
  adminRequiredMiddleware,
  async function (req: Request, res: Response, next: NextFunction) {
    try {
      const dateQuery = req.query.date as string;

      if (dateQuery === undefined) {
        res.status(400).send("Date required");
        return;
      }
      const date = DateTime.fromISO(dateQuery, {
        setZone: true,
      });
      const zone = date.zone;

      if (!date.isValid) {
        res.status(400).send("Invalid date");
        return;
      }

      await sequelize.transaction(async (t) => {
        const transactions = await Transaction.findAll({
          include: [
            {
              model: InTransaction,
              required: false,
            },
            {
              model: OutTransaction,
              required: false,
            },
          ],
          where: {
            [Op.or]: [
              literal("`InTransaction.id` IS NOT NULL"),
              literal("`OutTransaction.id` IS NOT NULL"),
            ],
            createdAt: {
              [Op.gte]: date.startOf("day").toJSDate(),
              [Op.lte]: date.endOf("day").toJSDate(),
            },
          },
          order: [
            ["createdAt", "DESC"],
            ["id", "DESC"],
          ],
          transaction: t,
        });

        const transfers = await Transfer.findAll({
          include: [
            {
              model: InTransfer,
              include: [
                {
                  model: InTransaction,
                  attributes: ["void"],
                },
                {
                  model: Item,
                  attributes: ["name"],
                  paranoid: false,
                  include: [
                    {
                      model: Unit,
                      attributes: ["name"],
                      paranoid: false,
                    },
                    {
                      model: Category,
                      attributes: ["name"],
                      paranoid: false,
                    },
                  ],
                },
              ],
              required: false,
            },
            {
              model: OutTransfer,
              include: [
                {
                  model: OutTransaction,
                  attributes: ["void"],
                },
                {
                  model: Item,
                  attributes: ["name"],
                  paranoid: false,
                  include: [
                    {
                      model: Unit,
                      attributes: ["name"],
                      paranoid: false,
                    },
                    {
                      model: Category,
                      attributes: ["name"],
                      paranoid: false,
                    },
                  ],
                },
              ],
              required: false,
            },
          ],
          where: {
            [Op.or]: [
              literal("`InTransfer.id` IS NOT NULL"),
              literal("`OutTransfer.id` IS NOT NULL"),
            ],
            createdAt: {
              [Op.gte]: date.startOf("day").toJSDate(),
              [Op.lte]: date.endOf("day").toJSDate(),
            },
          },
          order: [
            ["createdAt", "DESC"],
            ["id", "DESC"],
          ],
          transaction: t,
        });

        const items = await Item.findAll({
          include: [
            {
              model: Unit,
              attributes: ["name"],
              paranoid: false,
            },
            {
              model: Category,
              attributes: ["name"],
              paranoid: false,
            },
          ],
          paranoid: false,
          order: [
            ["createdAt", "DESC"],
            ["id", "DESC"],
          ],
          transaction: t,
        });

        const workbook = new excel.Workbook();

        const transactionsWorksheet = workbook.addWorksheet("Transactions");
        transactionsWorksheet.columns = [
          { header: "Type", key: "type" },
          { header: "Transaction ID", key: "transactionID" },
          { header: "Supplier", key: "supplier" },
          { header: "Customer", key: "customer" },
          { header: "Delivery Receipt", key: "deliveryReceipt" },
          { header: "Date of Delivery Receipt", key: "dateOfDeliveryReceipt" },
          { header: "Date Received", key: "dateReceived" },
          { header: "Void", key: "void" },
          { header: "Created At", key: "createdAt" },
          { header: "Updated At", key: "updatedAt" },
        ];

        transactionsWorksheet.columns.forEach((column) => {
          column.width = 25;
        });
        transactionsWorksheet.getColumn(1).width = 5;
        transactionsWorksheet.getColumn(2).width = 45;
        transactionsWorksheet.getColumn(2).font = {
          name: "Consolas",
        };
        transactionsWorksheet.getColumn(8).width = 10;
        transactionsWorksheet.getColumn(9).width = 30;
        transactionsWorksheet.getColumn(10).width = 30;

        transactionsWorksheet.getRow(1).font = { bold: true };

        transactions.forEach((e, index) => {
          const rowData: {
            type: string | null;
            transactionID: string | null;
            supplier: string | null;
            customer: string | null;
            deliveryReceipt: string | null;
            dateOfDeliveryReceipt: string | null;
            dateReceived: string | null;
            void: boolean | null;
            createdAt: string | null;
            updatedAt: string | null;
          } = {
            type: null,
            transactionID: null,
            supplier: null,
            customer: null,
            deliveryReceipt: null,
            dateOfDeliveryReceipt: null,
            dateReceived: null,
            void: null,
            createdAt: null,
            updatedAt: null,
          };

          if (e.InTransaction !== null) {
            rowData.type = "In";
            rowData.transactionID = e.InTransaction!.id;
            rowData.supplier = e.InTransaction!.supplier;
            rowData.deliveryReceipt = e.InTransaction!.deliveryReceipt;
            rowData.dateOfDeliveryReceipt =
              e.InTransaction!.dateOfDeliveryReceipt;
            rowData.dateReceived = e.InTransaction!.dateReceived;
            rowData.void = e.InTransaction!.void;
            rowData.createdAt = DateTime.fromJSDate(e.InTransaction!.createdAt)
              .setZone(zone)
              .toJSON();
            rowData.updatedAt = DateTime.fromJSDate(e.InTransaction!.updatedAt)
              .setZone(zone)
              .toJSON();
          } else if (e.OutTransaction !== null) {
            rowData.type = "Out";
            rowData.transactionID = e.OutTransaction!.id;
            rowData.customer = e.OutTransaction!.customer;
            rowData.deliveryReceipt = e.OutTransaction!.deliveryReceipt;
            rowData.dateOfDeliveryReceipt =
              e.OutTransaction!.dateOfDeliveryReceipt;
            rowData.void = e.OutTransaction!.void;
            rowData.createdAt = DateTime.fromJSDate(e.OutTransaction!.createdAt)
              .setZone(zone)
              .toJSON();
            rowData.updatedAt = DateTime.fromJSDate(e.OutTransaction!.updatedAt)
              .setZone(zone)
              .toJSON();
          }

          const row = transactionsWorksheet.addRow(rowData);

          if (e.InTransaction !== null) {
            row.getCell(4).fill = {
              type: "pattern",
              pattern: "gray125",
              fgColor: { argb: "FF000000" },
              bgColor: { argb: "FFFFFFFF" },
            };
          } else if (e.OutTransaction !== null) {
            row.getCell(3).fill = {
              type: "pattern",
              pattern: "gray125",
              fgColor: { argb: "FF000000" },
              bgColor: { argb: "FFFFFFFF" },
            };
            row.getCell(7).fill = {
              type: "pattern",
              pattern: "gray125",
              fgColor: { argb: "FF000000" },
              bgColor: { argb: "FFFFFFFF" },
            };
          }
        });
        await transactionsWorksheet.protect("", {});

        const transfersWorksheet = workbook.addWorksheet("Transfers");
        transfersWorksheet.columns = [
          { header: "Type", key: "type" },
          { header: "Transaction ID", key: "transactionID" },
          { header: "Transfer ID", key: "transferID" },
          { header: "Item ID", key: "itemID" },
          { header: "Item Name", key: "itemName" },
          { header: "Quantity", key: "quantity" },
          { header: "Item Unit", key: "itemUnit" },
          { header: "Item Category", key: "itemCategory" },
          { header: "Void", key: "void" },
          { header: "Created At", key: "createdAt" },
          { header: "Updated At", key: "updatedAt" },
        ];

        transfersWorksheet.columns.forEach((column) => {
          column.width = 25;
        });
        transfersWorksheet.getColumn(1).width = 5;
        transfersWorksheet.getColumn(2).width = 45;
        transfersWorksheet.getColumn(2).font = {
          name: "Consolas",
        };
        transfersWorksheet.getColumn(3).width = 45;
        transfersWorksheet.getColumn(3).font = {
          name: "Consolas",
        };
        transfersWorksheet.getColumn(4).width = 45;
        transfersWorksheet.getColumn(4).font = {
          name: "Consolas",
        };
        transfersWorksheet.getColumn(5).width = 45;
        transfersWorksheet.getColumn(6).width = 10;
        transfersWorksheet.getColumn(6).font = {
          name: "Consolas",
        };
        transfersWorksheet.getColumn(9).width = 10;
        transfersWorksheet.getColumn(10).width = 30;
        transfersWorksheet.getColumn(11).width = 30;

        transfersWorksheet.getRow(1).font = { bold: true };

        transfers.forEach((e, index) => {
          const rowData: {
            type: string | null;
            transactionID: string | null;
            transferID: string | null;
            itemID: string | null;
            itemName: string | null;
            quantity: number | null;
            itemUnit: string | null;
            itemCategory: string | null;
            void: boolean | null;
            createdAt: string | null;
            updatedAt: string | null;
          } = {
            type: null,
            transactionID: null,
            transferID: null,
            itemID: null,
            itemName: null,
            quantity: null,
            itemUnit: null,
            itemCategory: null,
            void: null,
            createdAt: null,
            updatedAt: null,
          };

          if (e.InTransfer !== null) {
            rowData.type = "In";
            rowData.transactionID = e.InTransfer!.transaction;
            rowData.transferID = e.InTransfer!.id;
            rowData.itemID = e.InTransfer!.item;
            rowData.itemName = e.InTransfer!.Item!.name;
            rowData.quantity = e.InTransfer!.quantity;
            rowData.itemUnit = e.InTransfer!.Item!.Unit!.name;
            rowData.itemCategory = e.InTransfer!.Item!.Category!.name;
            rowData.void = e.InTransfer!.InTransaction!.void;
            rowData.createdAt = DateTime.fromJSDate(e.InTransfer!.createdAt)
              .setZone(zone)
              .toJSON();
            rowData.updatedAt = DateTime.fromJSDate(e.InTransfer!.updatedAt)
              .setZone(zone)
              .toJSON();
          } else if (e.OutTransfer !== null) {
            rowData.type = "Out";
            rowData.transactionID = e.OutTransfer!.transaction;
            rowData.transferID = e.OutTransfer!.id;
            rowData.itemID = e.OutTransfer!.item;
            rowData.itemName = e.OutTransfer!.Item!.name;
            rowData.quantity = e.OutTransfer!.quantity;
            rowData.itemUnit = e.OutTransfer!.Item!.Unit!.name;
            rowData.itemCategory = e.OutTransfer!.Item!.Category!.name;
            rowData.void = e.OutTransfer!.OutTransaction!.void;
            rowData.createdAt = DateTime.fromJSDate(e.OutTransfer!.createdAt)
              .setZone(zone)
              .toJSON();
            rowData.updatedAt = DateTime.fromJSDate(e.OutTransfer!.updatedAt)
              .setZone(zone)
              .toJSON();
          }

          transfersWorksheet.addRow(rowData);
        });
        await transfersWorksheet.protect("", {});

        const itemsWorksheet = workbook.addWorksheet("Items");
        itemsWorksheet.columns = [
          { header: "ID", key: "ID" },
          { header: "Name", key: "name" },
          { header: "Stock", key: "stock" },
          { header: "Safety Stock", key: "safetyStock" },
          { header: "Unit", key: "unitName" },
          { header: "Category", key: "categoryName" },
          { header: "Remarks", key: "remarks" },
          { header: "Created At", key: "createdAt" },
          { header: "Updated At", key: "updatedAt" },
          { header: "Deleted At", key: "deletedAt" },
        ];

        itemsWorksheet.columns.forEach((column) => {
          column.width = 25;
        });
        itemsWorksheet.getColumn(1).width = 45;
        itemsWorksheet.getColumn(1).font = {
          name: "Consolas",
        };
        itemsWorksheet.getColumn(2).width = 45;
        itemsWorksheet.getColumn(3).width = 10;
        itemsWorksheet.getColumn(3).font = {
          name: "Consolas",
        };
        itemsWorksheet.getColumn(4).width = 10;
        itemsWorksheet.getColumn(4).font = {
          name: "Consolas",
        };
        itemsWorksheet.getColumn(8).width = 30;
        itemsWorksheet.getColumn(9).width = 30;
        itemsWorksheet.getColumn(10).width = 30;

        itemsWorksheet.getRow(1).font = { bold: true };

        items.forEach((e, index) => {
          const rowData: {
            ID: string | null;
            name: string | null;
            stock: number | null;
            safetyStock: number | null;
            unitName: string | null;
            categoryName: string | null;
            remarks: string | null;
            createdAt: string | null;
            updatedAt: string | null;
            deletedAt: string | null;
          } = {
            ID: null,
            name: null,
            stock: null,
            safetyStock: null,
            unitName: null,
            categoryName: null,
            remarks: null,
            createdAt: null,
            updatedAt: null,
            deletedAt: null,
          };

          rowData.ID = e.id;
          rowData.name = e.name;
          rowData.stock = e.stock;
          rowData.safetyStock = e.safetyStock;
          rowData.unitName = e.Unit!.name;
          rowData.categoryName = e.Category!.name;
          rowData.remarks = e.remarks;
          rowData.createdAt = DateTime.fromJSDate(e.createdAt)
            .setZone(zone)
            .toJSON();
          rowData.updatedAt = DateTime.fromJSDate(e.updatedAt)
            .setZone(zone)
            .toJSON();
          rowData.deletedAt =
            e.deletedAt !== null
              ? DateTime.fromJSDate(e.deletedAt!).setZone(zone).toJSON()
              : null;

          itemsWorksheet.addRow(rowData);
        });
        await itemsWorksheet.protect("", {});

        const tmpFile = tmp.fileSync({ mode: 0o644, postfix: ".xls" });
        await workbook.xlsx.writeFile(tmpFile.name);

        res.sendFile(tmpFile.name, (err) => {
          tmpFile.removeCallback();
        });
      });
    } catch (error: any) {
      next(error);
    }
  }
);

export default router;

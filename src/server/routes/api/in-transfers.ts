import { NextFunction, Request, Response, Router } from "express";
import { DateTime } from "luxon";
import { Op } from "sequelize";
import { loginRequiredMiddleware } from "../../middleware/auth";
import { InTransaction, InTransfer, Item, Unit } from "../../sequelize";

const router = Router();
router.use(loginRequiredMiddleware);

// router.post('/', async function (req: Request, res: Response, next: NextFunction) {
//     try {
//         const result = await sequelize.transaction(async (t) => {
//             const inTransaction = await InTransaction.create(
//                 {
//                     supplier: req.body.supplier,
//                     deliveryReceipt: req.body.deliveryReceipt,
//                     dateOfDeliveryReceipt: req.body.dateOfDeliveryReceipt,
//                     void: false,
//                 },
//                 {
//                     // include: [Unit, Category],
//                     transaction: t,
//                 },
//             );

//             const inTransfers: InTransferCreationAttributes_[] = [];
//             req.body.inTransfers.forEach((element: any) => {
//                 inTransfers.push({
//                     inTransaction: inTransaction.id,
//                     item: element.item,
//                     quantity: element.quantity,
//                 });
//             });

//             await InTransfer.bulkCreate(
//                 inTransfers,
//                 {
//                     validate: true,
//                     transaction: t,
//                 }
//             );

//             await inTransaction.reload({ transaction: t });

//             return inTransaction;
//         });

//         res.status(201).json(result);
//     } catch (error: any) {
//         next(error);
//     }
// });

router.get(
  "/",
  async function (req: Request, res: Response, next: NextFunction) {
    try {
      let whereAnd: any[] = [];

      const dateQuery = req.query.date as string;
      if (dateQuery !== undefined) {
        const date = DateTime.fromISO(dateQuery, {
          setZone: true,
        });
        if (!date.isValid) {
          res.status(400).send("Invalid date");
          return;
        } else {
          whereAnd.push({
            createdAt: {
              [Op.gte]: date.startOf("day").toJSDate(),
              [Op.lte]: date.endOf("day").toJSDate(),
            },
          });
        }
      }

      let whereItemAnd: any[] = [];

      const searchQuery = req.query.search as string;
      if (searchQuery !== undefined && searchQuery !== "") {
        whereItemAnd.push({
          name: {
            [Op.like]: `%${searchQuery}%`, // TODO
          },
        });
      }

      const count = await InTransfer.count({
        include: [
          {
            model: Item,
            attributes: ["id", "name"],
            paranoid: false,
            where: {
              [Op.and]: whereItemAnd,
            },
          },
        ],
        where: {
          [Op.and]: whereAnd,
        },
      });

      const cursorQuery = req.query.cursor as string;
      if (cursorQuery !== undefined) {
        const cursor = await InTransfer.findByPk(cursorQuery, {
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

      const results = await InTransfer.findAll({
        include: [
          {
            model: InTransaction,
            attributes: ["id", "void"],
          },
          {
            model: Item,
            attributes: ["id", "name"],
            paranoid: false,
            include: [
              {
                model: Unit,
                attributes: ["name"],
                paranoid: false,
              },
            ],
            where: {
              [Op.and]: whereItemAnd,
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
        count: count,
        results: results,
      });
    } catch (error: any) {
      next(error);
    }
  }
);

router.get(
  "/:id",
  async function (req: Request, res: Response, next: NextFunction) {
    try {
      const result = await InTransfer.findByPk(req.params.id, {
        include: [
          {
            model: InTransaction,
            attributes: ["id", "void"],
          },
          {
            model: Item,
            attributes: ["id", "name"],
            paranoid: false,
            include: [
              {
                model: Unit,
                attributes: ["name"],
                paranoid: false,
              },
            ],
          },
        ],
        rejectOnEmpty: true,
      });

      res.status(200).json(result);
    } catch (error: any) {
      next(error);
    }
  }
);

// router.put('/:id', async function (req: Request, res: Response, next: NextFunction) {
//     try {
//         const result = await sequelize.transaction(async (t) => {
//             const inTransaction = await InTransfer.findByPk(
//                 req.params.id,
//                 {
//                     include: [InTransfer],
//                     rejectOnEmpty: true,
//                     transaction: t,
//                     lock: t.LOCK.UPDATE,
//                 },
//             );

//             // inTransaction.name = req.body.name;
//             inTransaction.save({ transaction: t });

//             return inTransaction;
//         });

//         res.status(201).json(result);
//     } catch (error: any) {
//         next(error);
//     }
// });

// router.delete('/:id', async function (req: Request, res: Response, next: NextFunction) {
//     try {
//         const result = await sequelize.transaction(async (t) => {
//             const inTransaction = await InTransaction.findByPk(
//                 req.params.id,
//                 {
//                     include: [InTransfer],
//                     rejectOnEmpty: true,
//                     transaction: t,
//                 },
//             );

//             inTransaction.destroy({ transaction: t });

//             return inTransaction;
//         });

//         res.status(200).json(result);
//     } catch (error: any) {
//         next(error);
//     }
// });

export default router;

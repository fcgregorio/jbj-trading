import { NextFunction, Request, Response, Router } from "express";
import { DateTime } from "luxon";
import { literal, Op, Order, QueryTypes } from "sequelize";
import { loginRequiredMiddleware } from "../../middleware/auth";
import sequelize, {
  Category,
  InTransaction,
  InTransfer,
  Item,
  OutTransaction,
  OutTransfer,
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
      let order: Order = [["updatedAt", "DESC"]];

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

      const searchQuery = req.query.search as string;
      if (searchQuery !== undefined && searchQuery !== "") {
        whereAnd.push({
          [Op.or]: {
            "$InTransfer.Item.name$": {
              [Op.like]: `%${searchQuery}%`, // TODO
            },
            "$InTransfer.Item.Unit.name$": {
              [Op.like]: `%${searchQuery}%`, // TODO
            },
            "$InTransfer.Item.Category.name$": {
              [Op.like]: `%${searchQuery}%`, // TODO
            },
            "$OutTransfer.Item.name$": {
              [Op.like]: `%${searchQuery}%`, // TODO
            },
            "$OutTransfer.Item.Unit.name$": {
              [Op.like]: `%${searchQuery}%`, // TODO
            },
            "$OutTransfer.Item.Category.name$": {
              [Op.like]: `%${searchQuery}%`, // TODO
            },
          },
        });
      }

      const orderQuery = Boolean(req.query.order)
        ? JSON.parse(req.query.order as string)
        : null;
      if (orderQuery) {
        switch (orderQuery.by) {
          case "item":
            order = [
              literal(
                `IFNULL(\`InTransfer.Item.name\`, \`OutTransfer.Item.name\`) ${orderQuery.direction}`
              ),
            ];
            break;
          case "unit":
            order = [
              literal(
                `IFNULL(\`InTransfer.Item.Unit.name\`, \`OutTransfer.Item.Unit.name\`) ${orderQuery.direction}`
              ),
            ];
            break;
          case "category":
            order = [
              literal(
                `IFNULL(\`InTransfer.Item.Category.name\`, \`OutTransfer.Item.Category.name\`) ${orderQuery.direction}`
              ),
            ];
            break;
          case "void":
            order = [
              literal(
                `IFNULL(\`InTransfer.InTransaction.void\`, \`OutTransfer.OutTransaction.void\`) ${orderQuery.direction}`
              ),
            ];
            break;
          default:
            order = [[orderQuery.by, orderQuery.direction]];
        }
      }

      const cursorQuery = req.query.cursor as string;
      if (cursorQuery !== undefined) {
        const cursor = await Transfer.findByPk(cursorQuery, {
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

      const results = await Transfer.findAll({
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
          [Op.and]: whereAnd,
        },
        order: order,
        // limit: 100,
      });

      res.status(200).json({
        count: results.length,
        results: results,
      });
    } catch (error: any) {
      next(error);
    }
  }
);

export default router;

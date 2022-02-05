import { NextFunction, Request, Response, Router } from "express";
import { DateTime } from "luxon";
import { literal, Op, QueryTypes } from "sequelize";
import { loginRequiredMiddleware } from "../../middleware/auth";
import sequelize, {
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
      whereAnd.push({
        [Op.or]: [
          literal("`InTransfer.id` IS NOT NULL"),
          literal("`OutTransfer.id` IS NOT NULL"),
        ],
      });

      let countQueryWhere = ``;
      let countQueryInTransferJoin = ``;
      let countQueryOutTransferJoin = ``;
      let countQueryReplacements = {};

      const dateQuery = req.query.date as string;
      if (dateQuery !== undefined) {
        const date = DateTime.fromISO(req.query.date as string);
        if (!date.isValid) {
          res.status(400).send("Invalid date");
          return;
        } else {
          countQueryWhere =
            countQueryWhere +
            `(
                        'Transfer'.'createdAt' >= :startDate
                        AND
                        'Transfer'.'createdAt' <= :endDate
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

      let whereInTransferAnd: any[] = [];
      let whereOutTransferAnd: any[] = [];
      const searchQuery = req.query.search as string;
      if (searchQuery !== undefined && searchQuery !== "") {
        countQueryInTransferJoin =
          countQueryInTransferJoin +
          `
                    AND 'InTransfer->Item'.'name' LIKE :searchQuery
                `;
        countQueryOutTransferJoin =
          countQueryOutTransferJoin +
          `
                    AND 'OutTransfer->Item'.'name' LIKE :searchQuery
                `;
        countQueryReplacements = {
          ...countQueryReplacements,
          searchQuery: `%${searchQuery}%`,
        };

        whereInTransferAnd.push({
          name: {
            [Op.like]: `%${searchQuery}%`, // TODO
          },
        });
        whereOutTransferAnd.push({
          name: {
            [Op.like]: `%${searchQuery}%`, // TODO
          },
        });
      }

      const count = await sequelize.query(
        `SELECT
                (count('InTransfer'.'id') + count('OutTransfer'.'id')) AS 'count'
            FROM
                'transfers' AS 'Transfer'
            LEFT OUTER JOIN 'in_transfers' AS 'InTransfer'
                ON 'Transfer'.'inTransfer' = 'InTransfer'.'id'
            LEFT OUTER JOIN 'items' AS 'InTransfer->Item'
                ON 'InTransfer'.'item' = 'InTransfer->Item'.'id'
                ${countQueryInTransferJoin}
            LEFT OUTER JOIN 'out_transfers' AS 'OutTransfer'
                ON 'Transfer'.'outTransfer' = 'OutTransfer'.'id'
            LEFT OUTER JOIN 'items' AS 'OutTransfer->Item'
                ON 'OutTransfer'.'item' = 'OutTransfer->Item'.'id'
                ${countQueryOutTransferJoin}
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
                ],
                where: {
                  [Op.and]: whereInTransferAnd,
                },
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
                ],
                where: {
                  [Op.and]: whereOutTransferAnd,
                },
              },
            ],
            required: false,
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

export default router;

import { NextFunction, Request, Response, Router } from "express";
import { Op } from "sequelize";
import {
  adminRequiredMiddleware,
  loginRequiredMiddleware,
} from "../../middleware/auth";
import sequelize, {
  Category,
  Item,
  ItemHistory,
  Unit,
  User,
} from "../../sequelize";

const router = Router();
router.use(loginRequiredMiddleware);

router.post(
  "/",
  adminRequiredMiddleware,
  async function (req: Request, res: Response, next: NextFunction) {
    try {
      const result = await sequelize.transaction(async (t) => {
        const item = await Item.create(
          {
            name: req.body.name,
            safetyStock: req.body.safetyStock,
            stock: req.body.stock,
            remarks: req.body.remarks,
            unit: req.body.unit,
            category: req.body.category,
          },
          {
            transaction: t,
            user: res.locals.user,
          }
        );

        await item.reload({ transaction: t });

        return item;
      });

      res.status(201).json(result.id);
    } catch (error: any) {
      next(error);
    }
  }
);

router.get(
  "/",
  async function (req: Request, res: Response, next: NextFunction) {
    try {
      const user = res.locals.user as User;

      const filters = JSON.parse(req.query.filters as string);

      if (!user.admin) {
        filters.showDeleted = false;
      }

      let whereAnd: any[] = [];

      const searchQuery = req.query.search as string;
      if (searchQuery !== undefined && searchQuery !== "") {
        whereAnd.push({
          [Op.or]: {
            name: {
              [Op.like]: `%${searchQuery}%`, // TODO
            },
            remarks: {
              [Op.like]: `%${searchQuery}%`, // TODO
            },
            "$Unit.name$": {
              [Op.like]: `%${searchQuery}%`, // TODO
            },
            "$Category.name$": {
              [Op.like]: `%${searchQuery}%`, // TODO
            },
          },
        });
      }

      const count = await Item.count({
        where: {
          [Op.and]: whereAnd,
        },
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
      });

      const cursorQuery = req.query.cursor as string;
      if (cursorQuery !== undefined) {
        const cursor = await Item.findByPk(cursorQuery, {
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

      const results = await Item.findAll({
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
        where: {
          [Op.and]: whereAnd,
        },
        order: [
          ["createdAt", "DESC"],
          ["id", "DESC"],
        ],
        limit: 100,
        paranoid: !filters.showDeleted,
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
  "/alerts",
  adminRequiredMiddleware,
  async function (req: Request, res: Response, next: NextFunction) {
    try {
      let whereAnd: any[] = [];

      whereAnd.push({
        stock: {
          [Op.lte]: sequelize.col("safetyStock"),
        },
      });

      const count = await Item.count({
        where: {
          [Op.and]: whereAnd,
        },
      });

      const cursorQuery = req.query.cursor as string;
      if (cursorQuery !== undefined) {
        const cursor = await Item.findByPk(cursorQuery, {
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

      const results = await Item.findAll({
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
      const user = res.locals.user as User;

      let paranoid = true;
      if (user.admin) {
        paranoid = false;
      }

      const result = await Item.findByPk(req.params.id, {
        include: [
          {
            model: Unit,
            paranoid: false,
          },
          {
            model: Category,
            paranoid: false,
          },
        ],
        rejectOnEmpty: true,
        paranoid: paranoid,
      });

      res.status(200).json(result);
    } catch (error: any) {
      next(error);
    }
  }
);

router.get(
  "/:id/histories",
  adminRequiredMiddleware,
  async function (req: Request, res: Response, next: NextFunction) {
    try {
      let whereAnd: any[] = [];
      whereAnd.push({
        id: req.params.id,
      });

      const count = await ItemHistory.count({
        where: {
          [Op.and]: whereAnd,
        },
      });

      const cursorQuery = req.query.cursor as string;
      if (cursorQuery !== undefined) {
        const cursor = await ItemHistory.findByPk(cursorQuery, {
          attributes: ["historyId"],
          rejectOnEmpty: true,
        });

        whereAnd.push({
          historyId: {
            [Op.lt]: cursor.historyId,
          },
        });
      }

      const results = await ItemHistory.findAll({
        where: {
          [Op.and]: whereAnd,
        },
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
        order: [["historyId", "DESC"]],
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

router.put(
  "/:id",
  adminRequiredMiddleware,
  async function (req: Request, res: Response, next: NextFunction) {
    try {
      const result = await sequelize.transaction(async (t) => {
        const item = await Item.findByPk(req.params.id, {
          rejectOnEmpty: true,
          transaction: t,
          lock: t.LOCK.UPDATE,
        });

        item.name = req.body.name;
        item.safetyStock = req.body.safetyStock;
        item.stock = req.body.stock;
        item.remarks = req.body.remarks;
        item.unit = req.body.unit;
        item.category = req.body.category;
        await item.save({
          transaction: t,
          user: res.locals.user,
        });

        return item;
      });

      res.status(200).json(result.id);
    } catch (error: any) {
      next(error);
    }
  }
);

router.put(
  "/:id/restore",
  adminRequiredMiddleware,
  async function (req: Request, res: Response, next: NextFunction) {
    try {
      const result = await sequelize.transaction(async (t) => {
        const item = await Item.findByPk(req.params.id, {
          rejectOnEmpty: true,
          transaction: t,
          lock: t.LOCK.UPDATE,
          paranoid: false,
        });

        await item.restore({
          transaction: t,
          user: res.locals.user,
        });

        return item;
      });

      res.status(200).json(result.id);
    } catch (error: any) {
      next(error);
    }
  }
);

router.delete(
  "/:id",
  adminRequiredMiddleware,
  async function (req: Request, res: Response, next: NextFunction) {
    try {
      const result = await sequelize.transaction(async (t) => {
        const item = await Item.findByPk(req.params.id, {
          rejectOnEmpty: true,
          transaction: t,
          lock: t.LOCK.UPDATE,
        });

        await item.destroy({
          transaction: t,
          user: res.locals.user,
        });

        return item;
      });

      res.status(200).json(result.id);
    } catch (error: any) {
      next(error);
    }
  }
);

export default router;

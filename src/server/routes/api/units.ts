import { NextFunction, Request, Response, Router } from "express";
import { Op } from "sequelize";
import {
  adminRequiredMiddleware,
  loginRequiredMiddleware,
} from "../../middleware/auth";
import sequelize, { Unit, UnitHistory, User } from "../../sequelize";

const router = Router();
router.use(loginRequiredMiddleware);

router.post(
  "/",
  adminRequiredMiddleware,
  async function (req: Request, res: Response, next: NextFunction) {
    try {
      const result = await sequelize.transaction(async (t) => {
        const unit = await Unit.create(
          {
            name: req.body.name,
          },
          {
            transaction: t,
            user: res.locals.user,
          }
        );

        return unit;
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
          name: {
            [Op.like]: `%${searchQuery}%`, // TODO
          },
        });
      }

      const count = await Unit.count({
        where: {
          [Op.and]: whereAnd,
        },
      });

      const cursorQuery = req.query.cursor as string;
      if (cursorQuery !== undefined) {
        const cursor = await Unit.findByPk(cursorQuery, {
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

      const results = await Unit.findAll({
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
    } catch (error) {
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

      const result = await Unit.findByPk(req.params.id, {
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

      const count = await UnitHistory.count({
        where: {
          [Op.and]: whereAnd,
        },
      });

      const cursorQuery = req.query.cursor as string;
      if (cursorQuery !== undefined) {
        const cursor = await UnitHistory.findByPk(cursorQuery, {
          attributes: ["historyId"],
          rejectOnEmpty: true,
        });

        whereAnd.push({
          historyId: {
            [Op.lt]: cursor.historyId,
          },
        });
      }

      const results = await UnitHistory.findAll({
        where: {
          [Op.and]: whereAnd,
        },
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
        let unit = await Unit.findByPk(req.params.id, {
          rejectOnEmpty: true,
          transaction: t,
          lock: t.LOCK.UPDATE,
        });

        unit.name = req.body.name;
        await unit.save({
          transaction: t,
          user: res.locals.user,
        });

        return unit;
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
        let unit = await Unit.findByPk(req.params.id, {
          rejectOnEmpty: true,
          transaction: t,
          lock: t.LOCK.UPDATE,
          paranoid: false,
        });

        await unit.restore({
          transaction: t,
          user: res.locals.user,
        });

        return unit;
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
        const unit = await Unit.findByPk(req.params.id, {
          rejectOnEmpty: true,
          transaction: t,
        });

        await unit.destroy({
          transaction: t,
          user: res.locals.user,
        });

        return unit;
      });

      res.status(200).json(result.id);
    } catch (error: any) {
      next(error);
    }
  }
);

export default router;

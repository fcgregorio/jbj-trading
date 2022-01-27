import { NextFunction, Request, Response, Router } from 'express';
import sequelize, { Item, Unit, Category, ItemAttributes, ItemHistoryAttributes, ItemHistory, User } from '../../sequelize';
import { loginRequiredMiddleware, adminRequiredMiddleware } from '../../middleware/auth';
import { Op, WhereOptions } from 'sequelize';

const router = Router();
router.use(loginRequiredMiddleware);

router.post('/', adminRequiredMiddleware, async function (req: Request, res: Response, next: NextFunction) {
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
                },
            );

            await item.reload({ transaction: t });

            return item;
        });

        res.status(201).json(result.id);
    } catch (error: any) {
        next(error);
    }
});

router.get('/', async function (req: Request, res: Response, next: NextFunction) {
    try {
        const user = res.locals.user as User;

        const filters = JSON.parse(req.query.filters as string);

        if (!user.admin) {
            filters.showDeleted = false;
        }

        let where: WhereOptions<ItemAttributes> = {};

        const searchQuery = req.query.search as string;
        if (searchQuery !== undefined && searchQuery !== '') {
            where = {
                ...where,
                name: {
                    [Op.like]: '%' + searchQuery + '%', // TODO
                },
                remarks: {
                    [Op.like]: '%' + searchQuery + '%', // TODO
                },
            };

        }

        const count = await Item.count({
            where: where,
        });

        const cursorQuery = req.query.cursor as string;
        if (cursorQuery !== undefined) {
            const cursor = await Item.findByPk(
                cursorQuery,
                {
                    attributes: ['id', 'createdAt'],
                    rejectOnEmpty: true,
                },
            );

            where = {
                ...where,
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
                        ]
                    },
                ]
            };
        }

        const results = await Item.findAll({
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
            where: where,
            order: [
                ['createdAt', 'DESC'],
                ['id', 'DESC'],
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
});

router.get('/:id', async function (req: Request, res: Response, next: NextFunction) {
    try {
        const user = res.locals.user as User;

        let paranoid = true;
        if (user.admin) {
            paranoid = false;
        }

        const result = await Item.findByPk(
            req.params.id,
            {
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
            },
        );

        res.status(200).json(result);
    } catch (error: any) {
        next(error);
    }
});

router.get('/:id/histories', adminRequiredMiddleware, async function (req: Request, res: Response, next: NextFunction) {
    try {
        let where: WhereOptions<ItemHistoryAttributes> = {
            id: req.params.id,
        };

        const count = await ItemHistory.count({
            where: where,
        });

        const cursorQuery = req.query.cursor as string;
        if (cursorQuery !== undefined) {
            const cursor = await ItemHistory.findByPk(
                cursorQuery,
                {
                    attributes: ['historyId'],
                    rejectOnEmpty: true,
                },
            );

            where = {
                ...where,
                historyId: {
                    [Op.lt]: cursor.historyId,
                },
            };
        }

        const results = await ItemHistory.findAll({
            where: where,
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
            order: [
                ['historyId', 'DESC'],
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
});

router.put('/:id', adminRequiredMiddleware, async function (req: Request, res: Response, next: NextFunction) {
    try {
        const result = await sequelize.transaction(async (t) => {
            const item = await Item.findByPk(
                req.params.id,
                {
                    rejectOnEmpty: true,
                    transaction: t,
                    lock: t.LOCK.UPDATE,
                },
            );


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
});

router.put('/:id/restore', adminRequiredMiddleware, async function (req: Request, res: Response, next: NextFunction) {
    try {
        const result = await sequelize.transaction(async (t) => {
            const item = await Item.findByPk(
                req.params.id,
                {
                    rejectOnEmpty: true,
                    transaction: t,
                    lock: t.LOCK.UPDATE,
                    paranoid: false,
                },
            );

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
});

router.delete('/:id', adminRequiredMiddleware, async function (req: Request, res: Response, next: NextFunction) {
    try {
        const result = await sequelize.transaction(async (t) => {
            const item = await Item.findByPk(
                req.params.id,
                {
                    rejectOnEmpty: true,
                    transaction: t,
                    lock: t.LOCK.UPDATE,
                },
            );

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
});

export default router;
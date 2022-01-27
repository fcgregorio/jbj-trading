import { NextFunction, Request, Response, Router } from 'express';
import sequelize, { User, UserAttributes, UserHistory, UserHistoryAttributes } from '../../sequelize';
import { loginRequiredMiddleware, adminRequiredMiddleware } from '../../middleware/auth';
import { Op, WhereOptions } from 'sequelize';

const router = Router();
router.use(loginRequiredMiddleware);

router.post('/', adminRequiredMiddleware, async function (req: Request, res: Response, next: NextFunction) {
    try {
        const result = await sequelize.transaction(async (t) => {
            const password = await User.generatePassword(req.body.password);

            const user = await User.create(
                {
                    username: req.body.username,
                    firstName: req.body.firstName,
                    lastName: req.body.lastName,
                    admin: req.body.admin,
                    password: password,
                },
                {
                    transaction: t,
                    user: res.locals.user,
                },
            );

            return user;
        });

        res.status(201).json(result.id);
    } catch (error: any) {
        next(error);
    }
});

router.get('/', adminRequiredMiddleware, async function (req: Request, res: Response, next: NextFunction) {
    try {

        const user = res.locals.user as User;

        const filters = JSON.parse(req.query.filters as string);

        if (!user.admin) {
            filters.showDeleted = false;
        }

        let where: WhereOptions<UserAttributes> = {};

        const searchQuery = req.query.search as string;
        if (searchQuery !== undefined && searchQuery !== '') {
            where = {
                ...where,
                [Op.or]: {
                    username: {
                        [Op.like]: '%' + searchQuery + '%', // TODO
                    },
                    firstName: {
                        [Op.like]: '%' + searchQuery + '%', // TODO
                    },
                    lastName: {
                        [Op.like]: '%' + searchQuery + '%', // TODO
                    },
                },
            };

        }

        const count = await User.count({
            where: where,
            paranoid: !filters.showDeleted,
        });

        const cursorQuery = req.query.cursor as string;
        if (cursorQuery !== undefined) {
            const cursor = await User.findByPk(
                cursorQuery,
                {
                    attributes: ['id', 'createdAt'],
                    rejectOnEmpty: true,
                    paranoid: !filters.showDeleted,
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

        const results = await User.findAll({
            where: where,
            attributes: { exclude: ['password'] },
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
    } catch (error) {
        next(error);
    }
});

router.get('/self', async function (req: Request, res: Response, next: NextFunction) {
    const user = res.locals.user as User;
    res.status(200).json(user);
});

router.get('/:id', adminRequiredMiddleware, async function (req: Request, res: Response, next: NextFunction) {
    try {
        const user = res.locals.user as User;

        const result = await User.findByPk(
            req.params.id,
            {
                attributes: { exclude: ['password'] },
                rejectOnEmpty: true,
                paranoid: false,
            },
        );

        res.status(200).json(result);
    } catch (error: any) {
        next(error);
    }
});

router.get('/:id/histories', adminRequiredMiddleware, async function (req: Request, res: Response, next: NextFunction) {
    try {
        let where: WhereOptions<UserHistoryAttributes> = {
            id: req.params.id,
        };

        const count = await UserHistory.count({
            where: where,
        });

        const cursorQuery = req.query.cursor as string;
        if (cursorQuery !== undefined) {
            const cursor = await UserHistory.findByPk(
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

        const results = await UserHistory.findAll({
            where: where,
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
            let user = await User.findByPk(
                req.params.id,
                {
                    rejectOnEmpty: true,
                    transaction: t,
                    lock: t.LOCK.UPDATE,
                },
            );

            user.username = req.body.username;
            user.firstName = req.body.firstName;
            user.lastName = req.body.lastName;
            user.admin = req.body.admin;
            await user.save({
                transaction: t,
                user: res.locals.user,
            });

            return user;
        });

        res.status(200).json(result.id);
    } catch (error: any) {
        next(error);
    }
});

router.put('/:id/change-password', adminRequiredMiddleware, async function (req: Request, res: Response, next: NextFunction) {
    try {
        const result = await sequelize.transaction(async (t) => {
            const password = await User.generatePassword(req.body.password);

            let user = await User.findByPk(
                req.params.id,
                {
                    rejectOnEmpty: true,
                    transaction: t,
                    lock: t.LOCK.UPDATE,
                },
            );

            user.password = password;
            await user.save({
                transaction: t,
                user: res.locals.user,
            });

            return user;
        });

        res.status(200).json(result.id);
    } catch (error: any) {
        next(error);
    }
});

router.put('/:id/restore', adminRequiredMiddleware, async function (req: Request, res: Response, next: NextFunction) {
    try {
        const result = await sequelize.transaction(async (t) => {
            let user = await User.findByPk(
                req.params.id,
                {
                    rejectOnEmpty: true,
                    transaction: t,
                    lock: t.LOCK.UPDATE,
                    paranoid: false,
                },
            );

            await user.restore({
                transaction: t,
                user: res.locals.user,
            });

            return user;
        });

        res.status(200).json(result.id);
    } catch (error: any) {
        next(error);
    }
});

router.delete('/:id', adminRequiredMiddleware, async function (req: Request, res: Response, next: NextFunction) {
    try {
        const result = await sequelize.transaction(async (t) => {
            const user = await User.findByPk(
                req.params.id,
                {
                    rejectOnEmpty: true,
                    transaction: t,
                },
            );

            await user.destroy({
                transaction: t,
                user: res.locals.user,
            });

            return user;
        });

        res.status(200).json(result.id);
    } catch (error: any) {
        next(error);
    }
});

export default router;
import { NextFunction, Request, Response, Router } from 'express';
import sequelize, { InTransaction, InTransactionAttributes, InTransactionHistory, InTransactionHistoryAttributes, InTransfer, Item, Transaction, Transfer, Unit } from '../../sequelize';
import { loginRequiredMiddleware, adminRequiredMiddleware } from '../../middleware/auth';
import { Op, QueryTypes, ValidationError, WhereOptions } from 'sequelize';
import { DateTime } from 'luxon';

const router = Router();
router.use(loginRequiredMiddleware);

router.post('/', async function (req: Request, res: Response, next: NextFunction) {
    try {
        const result = await sequelize.transaction(async (t) => {
            const inTransaction = await InTransaction.create(
                {
                    supplier: req.body.supplier,
                    deliveryReceipt: req.body.deliveryReceipt,
                    dateOfDeliveryReceipt: req.body.dateOfDeliveryReceipt,
                    dateReceived: req.body.dateReceived,
                },
                {
                    include: [InTransfer],
                    transaction: t,
                    user: res.locals.user,
                },
            );

            await Transaction.create(
                {
                    inTransaction: inTransaction.id,
                    outTransaction: null,
                    createdAt: inTransaction.createdAt,
                    updatedAt: inTransaction.updatedAt,
                },
                {
                    transaction: t,
                    silent: true,
                },
            );

            if (req.body.inTransfers.length == 0) {
                throw new ValidationError('In-Transfers cannot be empty.');
            }

            req.body.inTransfers.reverse();
            for (const element of req.body.inTransfers) {
                const inTransfer = await InTransfer.create(
                    {
                        transaction: inTransaction.id,
                        item: element.item,
                        quantity: element.quantity,
                        createdAt: inTransaction.createdAt,
                        updatedAt: inTransaction.updatedAt,
                    },
                    {
                        transaction: t,
                        silent: true,
                    },
                );

                await Transfer.create(
                    {
                        inTransfer: inTransfer.id,
                        outTransfer: null,
                        createdAt: inTransfer.createdAt,
                        updatedAt: inTransfer.updatedAt,
                    },
                    {
                        transaction: t,
                        silent: true,
                    },
                );

                let item = await Item.findByPk(
                    element.item,
                    {
                        rejectOnEmpty: true,
                        transaction: t,
                        lock: t.LOCK.UPDATE,
                    },
                );

                await sequelize.query(
                    'UPDATE items SET updatedAt = :updatedAt WHERE id = :id',
                    {
                        replacements: {
                            id: item.id,
                            updatedAt: inTransfer.updatedAt,
                        },
                        type: QueryTypes.UPDATE,
                        transaction: t,
                    },
                );

                item = await item.reload({
                    transaction: t,
                    lock: t.LOCK.UPDATE,
                });

                item.stock = item.stock + element.quantity;
                await item.save(
                    {
                        transaction: t,
                        silent: true,
                        user: res.locals.user,
                    },
                );
            }

            return inTransaction;
        });

        res.status(201).json(result.id);
    } catch (error: any) {
        next(error);
    }
});

router.get('/', async function (req: Request, res: Response, next: NextFunction) {
    try {
        let where: WhereOptions<InTransactionAttributes> = {};

        const dateQuery = req.query.date as string;
        if (dateQuery !== undefined) {
            const date = DateTime.fromISO(req.query.date as string);
            if (!date.isValid) {
                res.status(400).send('Invalid date');
                return;
            } else {
                where = {
                    ...where,
                    createdAt: {
                        [Op.gte]: date.startOf('day').toJSDate(),
                        [Op.lte]: date.endOf('day').toJSDate(),
                    },
                };
            }
        }

        const searchQuery = req.query.search as string;
        if (searchQuery !== undefined && searchQuery !== '') {
            where = {
                ...where,
                supplier: {
                    [Op.like]: '%' + searchQuery + '%', // TODO
                },
            };

        }

        const count = await InTransaction.count({
            where: where,
        });

        const cursorQuery = req.query.cursor as string;
        if (cursorQuery !== undefined) {
            const cursor = await InTransaction.findByPk(
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

        const results = await InTransaction.findAll({
            include: [
                {
                    model: InTransfer,
                    attributes: ['quantity', 'item'],
                    include: [
                        {
                            model: Item,
                            attributes: ['name'],
                            paranoid: true,
                            include: [
                                {
                                    model: Unit,
                                    attributes: ['name'],
                                    paranoid: false,
                                },
                            ],
                        },
                    ],
                    order: [
                        ['createdAt', 'DESC'],
                        ['id', 'DESC'],
                    ],
                },
            ],
            where: where,
            order: [
                ['createdAt', 'DESC'],
                ['id', 'DESC'],
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

router.get('/:id', async function (req: Request, res: Response, next: NextFunction) {
    try {
        const result = await InTransaction.findByPk(
            req.params.id,
            {
                include: [
                    {
                        model: InTransfer,
                        attributes: ['quantity', 'item'],
                        include: [
                            {
                                model: Item,
                                attributes: ['name'],
                                paranoid: false,
                                include: [
                                    {
                                        model: Unit,
                                        attributes: ['name'],
                                        paranoid: false,
                                    },
                                ],
                            },
                        ],
                        order: [
                            ['createdAt', 'DESC'],
                            ['id', 'DESC'],
                        ],
                    },
                ],
                rejectOnEmpty: true,
            },
        );

        res.status(200).json(result);
    } catch (error: any) {
        next(error);
    }
});

router.get('/:id/histories', adminRequiredMiddleware, async function (req: Request, res: Response, next: NextFunction) {
    try {
        let where: WhereOptions<InTransactionHistoryAttributes> = {
            id: req.params.id,
        };

        const count = await InTransactionHistory.count({
            where: where,
        });

        const cursorQuery = req.query.cursor as string;
        if (cursorQuery !== undefined) {
            const cursor = await InTransactionHistory.findByPk(
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

        const results = await InTransactionHistory.findAll({
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
            const inTransaction = await InTransaction.findByPk(
                req.params.id,
                {
                    include: [InTransfer],
                    rejectOnEmpty: true,
                    transaction: t,
                    lock: t.LOCK.UPDATE,
                },
            );

            if (inTransaction.void && !req.body.void) {
                throw new ValidationError('In-Transaction already void.');
            }

            let voided = false;
            if (!inTransaction.void && req.body.void) {
                voided = true;
            }

            inTransaction.supplier = req.body.supplier;
            inTransaction.deliveryReceipt = req.body.deliveryReceipt;
            inTransaction.dateOfDeliveryReceipt = req.body.dateOfDeliveryReceipt;
            inTransaction.dateReceived = req.body.dateReceived;
            inTransaction.void = req.body.void;
            const updatedInTransaction = await inTransaction.save({
                transaction: t,
                user: res.locals.user,
            });

            const transaction = await Transaction.findOne({
                where: {
                    inTransaction: inTransaction.id,
                },
                rejectOnEmpty: true,
                transaction: t,
                lock: t.LOCK.UPDATE,
            });

            await sequelize.query(
                'UPDATE transactions SET updatedAt = :updatedAt WHERE id = :id',
                {
                    replacements: {
                        id: transaction.id,
                        updatedAt: updatedInTransaction.updatedAt,
                    },
                    type: QueryTypes.UPDATE,
                    transaction: t,
                },
            );

            if (voided) {
                for (const inTransfer of inTransaction.InTransfers!) {
                    await sequelize.query(
                        'UPDATE in_transfers SET updatedAt = :updatedAt WHERE id = :id',
                        {
                            replacements: {
                                id: inTransfer.id,
                                updatedAt: updatedInTransaction.updatedAt,
                            },
                            type: QueryTypes.UPDATE,
                            transaction: t,
                        },
                    );

                    const transfer = await Transfer.findOne({
                        where: {
                            inTransfer: inTransfer.id,
                        },
                        rejectOnEmpty: true,
                        transaction: t,
                        lock: t.LOCK.UPDATE,
                    });

                    await sequelize.query(
                        'UPDATE transfers SET updatedAt = :updatedAt WHERE id = :id',
                        {
                            replacements: {
                                id: transfer.id,
                                updatedAt: updatedInTransaction.updatedAt,
                            },
                            type: QueryTypes.UPDATE,
                            transaction: t,
                        },
                    );

                    let item = await Item.findByPk(
                        inTransfer.item,
                        {
                            rejectOnEmpty: true,
                            transaction: t,
                            lock: t.LOCK.UPDATE,
                        },
                    );

                    await sequelize.query(
                        'UPDATE items SET updatedAt = :updatedAt WHERE id = :id',
                        {
                            replacements: {
                                id: item.id,
                                updatedAt: updatedInTransaction.updatedAt,
                            },
                            type: QueryTypes.UPDATE,
                            transaction: t,
                        },
                    );

                    item = await item.reload({
                        transaction: t,
                        lock: t.LOCK.UPDATE,
                    });

                    item.stock = item.stock - inTransfer.quantity;
                    await item.save(
                        {
                            transaction: t,
                            silent: true,
                            user: res.locals.user,
                        },
                    );
                }
            }

            return inTransaction;
        });

        res.status(200).json(result.id);
    } catch (error: any) {
        next(error);
    }
});

// router.delete('/:id', adminRequiredMiddleware, async function (req: Request, res: Response, next: NextFunction) {
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

//             await inTransaction.destroy({ transaction: t });

//             return inTransaction;
//         });

//         res.status(200).json(result.id);
//     } catch (error: any) {
//         next(error);
//     }
// });

export default router;
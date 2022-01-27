import { NextFunction, Request, Response, Router } from 'express';
import sequelize, { OutTransaction, OutTransfer, OutTransferAttributes, ItemAttributes, OutTransferCreationAttributes, Item, Unit } from '../../sequelize';
import { loginRequiredMiddleware } from '../../middleware/auth';
import { Op, WhereOptions } from 'sequelize';
import { DateTime } from 'luxon';

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

router.get('/', async function (req: Request, res: Response, next: NextFunction) {
    try {
        let where: WhereOptions<OutTransferAttributes> = {};

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

        let whereItem: WhereOptions<ItemAttributes> = {};

        const searchQuery = req.query.search as string;
        if (searchQuery !== undefined && searchQuery !== '') {
            whereItem = {
                ...whereItem,
                name: {
                    [Op.like]: '%' + searchQuery + '%', // TODO
                },
            };
        }

        const count = await OutTransfer.count({
            include: [
                {
                    model: Item,
                    attributes: ['id', 'name'],
                    paranoid: false,
                    where: whereItem,
                },
            ],
            where: where,
        });

        const cursorQuery = req.query.cursor as string;
        if (cursorQuery !== undefined) {
            const cursor = await OutTransfer.findByPk(
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
                                    [Op.lt]: cursor.transaction,
                                },
                            },
                        ]
                    },
                ]
            };
        }

        const results = await OutTransfer.findAll({
            include: [
                {
                    model: OutTransaction,
                    attributes: ['id', 'void']
                },
                {
                    model: Item,
                    attributes: ['id', 'name'],
                    paranoid: false,
                    include: [
                        {
                            model: Unit,
                            attributes: ['name'],
                            paranoid: false,
                        },
                    ],
                    where: whereItem,
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
        const result = await OutTransfer.findByPk(
            req.params.id,
            {
                include: [
                    {
                        model: OutTransaction,
                        attributes: ['id', 'void']
                    },
                    {
                        model: Item,
                        attributes: ['id', 'name'],
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
                rejectOnEmpty: true,
            },
        );

        res.status(200).json(result);
    } catch (error: any) {
        next(error);
    }
});

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
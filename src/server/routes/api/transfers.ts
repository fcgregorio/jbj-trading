import { NextFunction, Request, Response, Router } from 'express';
import { DateTime } from 'luxon';
import { literal, Op, QueryTypes, WhereOptions } from 'sequelize';
import { loginRequiredMiddleware } from '../../middleware/auth';
import sequelize, { InTransaction, InTransfer, InTransferAttributes, Item, ItemAttributes, OutTransaction, OutTransfer, OutTransferAttributes, Transfer, TransferAttributes, Unit } from '../../sequelize';

const router = Router();
router.use(loginRequiredMiddleware);

router.get('/', async function (req: Request, res: Response, next: NextFunction) {
    try {
        let where: WhereOptions<TransferAttributes> = {
            [Op.or]: [
                literal('`InTransfer.id` IS NOT NULL'),
                literal('`OutTransfer.id` IS NOT NULL'),
            ],
        };

        let countQueryWhere = ``;
        let countQueryInTransferJoin = ``;
        let countQueryOutTransferJoin = ``;
        let countQueryReplacements = {};

        const dateQuery = req.query.date as string;
        if (dateQuery !== undefined) {
            const date = DateTime.fromISO(req.query.date as string);
            if (!date.isValid) {
                res.status(400).send('Invalid date');
                return;
            } else {
                countQueryWhere = countQueryWhere +
                    `(
                        'Transfer'.'createdAt' >= :startDate
                        AND
                        'Transfer'.'createdAt' <= :endDate
                    )`;
                countQueryReplacements = {
                    ...countQueryReplacements,
                    startDate: date.startOf('day').setZone('utc').toFormat('yyyy-LL-dd HH:mm:ss ZZ'),
                    endDate: date.endOf('day').setZone('utc').toFormat('yyyy-LL-dd HH:mm:ss ZZ'),
                };

                where = {
                    ...where,
                    createdAt: {
                        [Op.gte]: date.startOf('day').toJSDate(),
                        [Op.lte]: date.endOf('day').toJSDate(),
                    },
                };
            }
        }

        let whereInTransfer: WhereOptions<ItemAttributes> = {};
        let whereOutTransfer: WhereOptions<ItemAttributes> = {};
        const searchQuery = req.query.search as string;
        if (searchQuery !== undefined && searchQuery !== '') {
            countQueryInTransferJoin = countQueryInTransferJoin +
                `
                    AND 'InTransfer->Item'.'name' LIKE :searchQuery
                `;
            countQueryOutTransferJoin = countQueryOutTransferJoin +
                `
                    AND 'OutTransfer->Item'.'name' LIKE :searchQuery
                `;
            countQueryReplacements = {
                ...countQueryReplacements,
                searchQuery: '%' + searchQuery + '%',
            };

            whereInTransfer = {
                ...whereInTransfer,
                name: {
                    [Op.like]: '%' + searchQuery + '%', // TODO
                },
            };
            whereOutTransfer = {
                ...whereOutTransfer,
                name: {
                    [Op.like]: '%' + searchQuery + '%', // TODO
                },
            };
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
            },
        );

        const cursorQuery = req.query.cursor as string;
        if (cursorQuery !== undefined) {
            const cursor = await Transfer.findByPk(
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

        const results = await Transfer.findAll({
            include: [
                {
                    model: InTransfer,
                    include: [
                        {
                            model: InTransaction,
                            attributes: ['void'],
                        },
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
                            where: whereInTransfer,
                        },
                    ],
                    required: false,
                },
                {
                    model: OutTransfer,
                    include: [
                        {
                            model: OutTransaction,
                            attributes: ['void'],
                        },
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
                            where: whereOutTransfer,
                        },
                    ],
                    required: false,
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
            count: (count[0] as any).count,
            results: results,
        });
    } catch (error: any) {
        next(error);
    }
});

export default router;
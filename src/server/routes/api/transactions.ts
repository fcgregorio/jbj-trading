import excel from 'exceljs';
import { NextFunction, Request, Response, Router } from 'express';
import { DateTime } from 'luxon';
import { literal, Op, QueryTypes, WhereOptions } from 'sequelize';
import { adminRequiredMiddleware, loginRequiredMiddleware } from '../../middleware/auth';
import sequelize, { InTransaction, InTransactionAttributes, InTransfer, Item, OutTransaction, OutTransactionAttributes, OutTransfer, Transaction, TransactionAttributes, Transfer, Unit } from '../../sequelize';
import tmp from 'tmp';

const router = Router();
router.use(loginRequiredMiddleware);

router.get('/', async function (req: Request, res: Response, next: NextFunction) {
    try {
        let where: WhereOptions<TransactionAttributes> = {
            [Op.or]: [
                literal('`InTransaction.id` IS NOT NULL'),
                literal('`OutTransaction.id` IS NOT NULL'),
            ],
        };

        let countQueryWhere = ``;
        let countQueryInTransactionJoin = ``;
        let countQueryOutTransactionJoin = ``;
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
                        'Transaction'.'createdAt' >= :startDate
                        AND
                        'Transaction'.'createdAt' <= :endDate
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

        let whereInTransaction: WhereOptions<InTransactionAttributes> = {};
        let whereOutTransaction: WhereOptions<OutTransactionAttributes> = {};
        const searchQuery = req.query.search as string;
        if (searchQuery !== undefined && searchQuery !== '') {
            countQueryInTransactionJoin = countQueryInTransactionJoin +
                `
                    AND 'InTransaction'.'supplier' LIKE :searchQuery
                `;
            countQueryOutTransactionJoin = countQueryOutTransactionJoin +
                `
                    AND 'OutTransaction'.'customer' LIKE :searchQuery
                `;
            countQueryReplacements = {
                ...countQueryReplacements,
                searchQuery: '%' + searchQuery + '%',
            };

            whereInTransaction = {
                ...whereInTransaction,
                supplier: {
                    [Op.like]: '%' + searchQuery + '%', // TODO
                },
            };
            whereOutTransaction = {
                ...whereOutTransaction,
                customer: {
                    [Op.like]: '%' + searchQuery + '%', // TODO
                },
            };
        }

        const count = await sequelize.query(
            `SELECT
                (count('InTransaction'.'id') + count('OutTransaction'.'id')) AS 'count'
            FROM
                'transactions' AS 'Transaction'
            LEFT OUTER JOIN 'in_transactions' AS 'InTransaction'
                ON 'Transaction'.'inTransaction' = 'InTransaction'.'id'
                ${countQueryInTransactionJoin}
            LEFT OUTER JOIN 'out_transactions' AS 'OutTransaction'
                ON 'Transaction'.'outTransaction' = 'OutTransaction'.'id'
                ${countQueryOutTransactionJoin}
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
            const cursor = await Transaction.findByPk(
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

        const results = await Transaction.findAll({
            include: [
                {
                    model: InTransaction,
                    required: false,
                    where: whereInTransaction,
                },
                {
                    model: OutTransaction,
                    required: false,
                    where: whereOutTransaction,
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

router.get('/export', adminRequiredMiddleware, async function (req: Request, res: Response, next: NextFunction) {
    try {
        const dateQuery = req.query.date as string;

        if (dateQuery === undefined) {
            res.status(400).send('Date required');
            return;
        }
        const date = DateTime.fromISO(dateQuery);
        const zone = DateTime.fromISO(dateQuery, { setZone: true }).zone;

        if (!date.isValid) {
            res.status(400).send('Invalid date');
            return;
        }

        const transactions = await Transaction.findAll({
            include: [
                {
                    model: InTransaction,
                    required: false,
                },
                {
                    model: OutTransaction,
                    required: false,
                },
            ],
            where: {
                [Op.or]: [
                    literal('`InTransaction.id` IS NOT NULL'),
                    literal('`OutTransaction.id` IS NOT NULL'),
                ],
                createdAt: {
                    [Op.gte]: date.startOf('day').toJSDate(),
                    [Op.lte]: date.endOf('day').toJSDate(),
                },
            },
            order: [
                ['createdAt', 'DESC'],
                ['id', 'DESC'],
            ],
        });

        const transfers = await Transfer.findAll({
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
                        },
                    ],
                    required: false,
                },
            ],
            where: {
                [Op.or]: [
                    literal('`InTransfer.id` IS NOT NULL'),
                    literal('`OutTransfer.id` IS NOT NULL'),
                ],
                createdAt: {
                    [Op.gte]: date.startOf('day').toJSDate(),
                    [Op.lte]: date.endOf('day').toJSDate(),
                },
            },
            order: [
                ['createdAt', 'DESC'],
                ['id', 'DESC'],
            ],
        });

        const workbook = new excel.Workbook();

        const transactionsWorksheet = workbook.addWorksheet('Transactions');
        transactionsWorksheet.columns = [
            { header: 'Type', key: 'type' },
            { header: 'Transaction ID', key: 'transactionID' },
            { header: 'Supplier', key: 'supplier' },
            { header: 'Customer', key: 'customer' },
            { header: 'Delivery Receipt', key: 'deliveryReceipt' },
            { header: 'Date of Delivery Receipt', key: 'dateOfDeliveryReceipt' },
            { header: 'Date Received', key: 'dateReceived' },
            { header: 'Void', key: 'void' },
            { header: 'Created At', key: 'createdAt' },
            { header: 'Updated At', key: 'updatedAt' },
        ];

        transactionsWorksheet.columns.forEach(column => {
            column.width = 25;
        });
        transactionsWorksheet.getColumn(1).width = 5;
        transactionsWorksheet.getColumn(2).width = 40;
        transactionsWorksheet.getColumn(8).width = 10;
        transactionsWorksheet.getColumn(9).width = 30;
        transactionsWorksheet.getColumn(10).width = 30;
        transactionsWorksheet.getRow(1).font = { bold: true };

        transactions.forEach((e, index) => {
            // row 1 is the header.
            const rowIndex = index + 2;

            const rowData: {
                type: string | null,
                transactionID: string | null,
                supplier: string | null,
                customer: string | null,
                deliveryReceipt: string | null,
                dateOfDeliveryReceipt: string | null,
                dateReceived: string | null,
                void: boolean | null,
                createdAt: string | null,
                updatedAt: string | null,
            } = {
                type: null,
                transactionID: null,
                supplier: null,
                customer: null,
                deliveryReceipt: null,
                dateOfDeliveryReceipt: null,
                dateReceived: null,
                void: null,
                createdAt: null,
                updatedAt: null,
            };

            if (e.InTransaction !== null) {
                rowData.type = 'In';
                rowData.transactionID = e.InTransaction!.id;
                rowData.supplier = e.InTransaction!.supplier;
                rowData.deliveryReceipt = e.InTransaction!.deliveryReceipt;
                rowData.dateOfDeliveryReceipt = e.InTransaction!.dateOfDeliveryReceipt;
                rowData.dateReceived = e.InTransaction!.dateReceived;
                rowData.void = e.InTransaction!.void;
                rowData.createdAt = DateTime.fromJSDate(e.InTransaction!.createdAt).setZone(zone).toJSON();
                rowData.updatedAt = DateTime.fromJSDate(e.InTransaction!.updatedAt).setZone(zone).toJSON();
            } else if (e.OutTransaction !== null) {
                rowData.type = 'Out';
                rowData.transactionID = e.OutTransaction!.id;
                rowData.customer = e.OutTransaction!.customer;
                rowData.deliveryReceipt = e.OutTransaction!.deliveryReceipt;
                rowData.dateOfDeliveryReceipt = e.OutTransaction!.dateOfDeliveryReceipt;
                rowData.void = e.OutTransaction!.void;
                rowData.createdAt = DateTime.fromJSDate(e.OutTransaction!.createdAt).setZone(zone).toJSON();
                rowData.updatedAt = DateTime.fromJSDate(e.OutTransaction!.updatedAt).setZone(zone).toJSON();
            }

            const row = transactionsWorksheet.addRow(rowData);

            if (e.InTransaction !== null) {
                row.getCell(4).fill = {
                    type: 'pattern',
                    pattern: 'gray125',
                    fgColor: { argb: 'FF000000' },
                    bgColor: { argb: 'FFFFFFFF' },
                };
            } else if (e.OutTransaction !== null) {
                row.getCell(3).fill = {
                    type: 'pattern',
                    pattern: 'gray125',
                    fgColor: { argb: 'FF000000' },
                    bgColor: { argb: 'FFFFFFFF' },
                };
                row.getCell(7).fill = {
                    type: 'pattern',
                    pattern: 'gray125',
                    fgColor: { argb: 'FF000000' },
                    bgColor: { argb: 'FFFFFFFF' },
                };
            }
        });
        await transactionsWorksheet.protect('', {});

        const transfersWorksheet = workbook.addWorksheet('Transfers');
        transfersWorksheet.columns = [
            { header: 'Type', key: 'type' },
            { header: 'Transfer ID', key: 'transferID' },
            { header: 'Item ID', key: 'itemID' },
            { header: 'Item Name', key: 'itemName' },
            { header: 'Quantity', key: 'quantity' },
            { header: 'Item Unit', key: 'itemUnit' },
            { header: 'Void', key: 'void' },
            { header: 'Created At', key: 'createdAt' },
            { header: 'Updated At', key: 'updatedAt' },
        ];

        transfersWorksheet.columns.forEach(column => {
            column.width = 25;
        });
        transfersWorksheet.getColumn(1).width = 5;
        transfersWorksheet.getColumn(2).width = 40;
        transfersWorksheet.getColumn(3).width = 40;
        transfersWorksheet.getColumn(7).width = 10;
        transfersWorksheet.getColumn(8).width = 30;
        transfersWorksheet.getColumn(9).width = 30;
        transfersWorksheet.getRow(1).font = { bold: true };

        transfers.forEach((e, index) => {
            // row 1 is the header.
            const rowIndex = index + 2;

            const rowData: {
                type: string | null,
                transferID: string | null,
                itemID: string | null,
                itemName: string | null,
                quantity: number | null,
                itemUnit: string | null,
                void: boolean | null,
                createdAt: string | null,
                updatedAt: string | null,
            } = {
                type: null,
                transferID: null,
                itemID: null,
                itemName: null,
                quantity: null,
                itemUnit: null,
                void: null,
                createdAt: null,
                updatedAt: null,
            };

            if (e.InTransfer !== null) {
                rowData.type = 'In';
                rowData.transferID = e.InTransfer!.id;
                rowData.itemID = e.InTransfer!.item;
                rowData.itemName = e.InTransfer!.Item!.name;
                rowData.quantity = e.InTransfer!.quantity;
                rowData.itemUnit = e.InTransfer!.Item!.Unit!.name;
                rowData.void = e.InTransfer!.InTransaction!.void;
                rowData.createdAt = DateTime.fromJSDate(e.InTransfer!.createdAt).setZone(zone).toJSON();
                rowData.updatedAt = DateTime.fromJSDate(e.InTransfer!.updatedAt).setZone(zone).toJSON();
            } else if (e.OutTransfer !== null) {
                rowData.type = 'Out';
                rowData.transferID = e.OutTransfer!.id;
                rowData.itemID = e.OutTransfer!.item;
                rowData.itemName = e.OutTransfer!.Item!.name;
                rowData.quantity = e.OutTransfer!.quantity;
                rowData.itemUnit = e.OutTransfer!.Item!.Unit!.name;
                rowData.void = e.OutTransfer!.OutTransaction!.void;
                rowData.createdAt = DateTime.fromJSDate(e.OutTransfer!.createdAt).setZone(zone).toJSON();
                rowData.updatedAt = DateTime.fromJSDate(e.OutTransfer!.updatedAt).setZone(zone).toJSON();
            }

            transfersWorksheet.addRow(rowData);
        });
        await transfersWorksheet.protect('', {});

        const tmpFile = tmp.fileSync({ mode: 0o644, postfix: '.xls' });
        await workbook.xlsx.writeFile(tmpFile.name);

        res.sendFile(tmpFile.name, (err) => {
            tmpFile.removeCallback();
        });
    } catch (error: any) {
        next(error);
    }
});

export default router;
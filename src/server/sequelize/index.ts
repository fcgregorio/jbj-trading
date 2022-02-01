import {
    pbkdf2
} from 'crypto';
import _ from 'lodash';
import {
    DataTypes,
    InstanceDestroyOptions,
    InstanceRestoreOptions,
    SaveOptions,
    Model,
    Sequelize,
    Transaction as SequelizeTransaction,
} from "sequelize";
import {
    v4 as uuidv4
} from 'uuid';
import config from '../../../config/sequelize';
import Logger from '../winston';

declare module "sequelize" {
    interface InstanceRestoreOptions { user?: User; }
    interface InstanceDestroyOptions { user?: User; }
    interface SaveOptions { user?: User; }
}

let castedConfig: {
    [key: string]: any;
} = config;

const sequelizeConfig = castedConfig[process.env.NODE_ENV ? process.env.NODE_ENV : 'development'];
var sequelize = new Sequelize(sequelizeConfig.database, sequelizeConfig.username, sequelizeConfig.password,
    {
        dialect: sequelizeConfig.dialect,
        storage: sequelizeConfig.storage,
        host: sequelizeConfig.host,
        port: sequelizeConfig.port,
        isolationLevel: SequelizeTransaction.ISOLATION_LEVELS.SERIALIZABLE,
        logQueryParameters: sequelizeConfig.logQueryParameters,
        logging: msg => Logger.info(msg),
        benchmark: sequelizeConfig.benchmark,
    });

export interface UserAttributes {
    id: string;
    username: string;
    firstName: string;
    lastName: string;
    password: string;
    admin: boolean;
    createdAt: Date;
    updatedAt: Date;
    deletedAt?: Date;
}

export interface UserCreationAttributes {
    username: string;
    firstName: string;
    lastName: string;
    password: string;
    admin: boolean;
}

export class User extends Model<UserAttributes, UserCreationAttributes> implements UserAttributes {
    public id!: string;
    public username!: string;
    public firstName!: string;
    public lastName!: string;
    public password!: string;
    public admin!: boolean;

    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
    public readonly deletedAt?: Date;

    // $<salt>$<hash>
    // https://docs.djangoproject.com/en/3.2/topics/auth/passwords/
    // https://github.com/django/django/blob/main/django/contrib/auth/hashers.py
    static generatePassword(rawPassword: string, salt: string = uuidv4()) {
        return new Promise<string>((resolve, reject) => {
            pbkdf2(rawPassword, salt, 390000, 64, 'sha512', (err, derivedKey) => {
                if (err) return reject(err);

                const hash = derivedKey.toString('hex');
                return resolve(`${salt}$${hash}`);
            });
        });
    }

    async checkPassword(rawPassword: string) {
        const [salt,] = this.password.split('$');
        const password = await User.generatePassword(rawPassword, salt);

        return password === this.password;
    }
}

User.init(
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            allowNull: false,
            primaryKey: true,
            unique: true,
        },
        username: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: {
                name: 'username',
                msg: 'Must be unique'
            },
            validate: {
                notNull: {
                    msg: 'Required',
                },
                notEmpty: {
                    msg: 'Must be non-empty'
                },
            },
        },
        firstName: {
            type: DataTypes.STRING,
            allowNull: false,
            validate: {
                notNull: {
                    msg: 'Required',
                },
                notEmpty: {
                    msg: 'Must be non-empty'
                },
            },
        },
        lastName: {
            type: DataTypes.STRING,
            allowNull: false,
            validate: {
                notNull: {
                    msg: 'Required',
                },
                notEmpty: {
                    msg: 'Must be non-empty'
                },
            },
        },
        password: {
            type: DataTypes.STRING,
            allowNull: false,
            validate: {
                notNull: {
                    msg: 'Required',
                },
                notEmpty: {
                    msg: 'Must be non-empty'
                },
            },
        },
        admin: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
            allowNull: false,
            validate: {
                notNull: {
                    msg: 'Required',
                },
            },
        },
        createdAt: {
            type: DataTypes.DATE,
            allowNull: false,
        },
        updatedAt: {
            type: DataTypes.DATE,
            allowNull: false,
        },
        deletedAt: {
            type: DataTypes.DATE,
            allowNull: true,
        },
    },
    {
        tableName: 'users',
        paranoid: true,
        indexes: [
            {
                fields: ['id', 'createdAt'],
            },
        ],
        sequelize: sequelize,
    }
);

User.addHook('afterSave', async (instance: Model<UserAttributes, UserCreationAttributes>, options: SaveOptions<UserAttributes>) => {
    await UserHistory.create(
        {
            historyUser: options.user!.id,
            id: instance.getDataValue('id'),
            username: instance.getDataValue('username'),
            firstName: instance.getDataValue('firstName'),
            lastName: instance.getDataValue('lastName'),
            password: instance.getDataValue('password'),
            admin: instance.getDataValue('admin'),
            createdAt: instance.getDataValue('createdAt'),
            updatedAt: instance.getDataValue('updatedAt'),
            deletedAt: instance.getDataValue('deletedAt'),
        },
        {
            transaction: options.transaction,
        },
    );
});
User.addHook('afterDestroy', async (instance: Model<UserAttributes, UserCreationAttributes>, options: InstanceDestroyOptions) => {
    await UserHistory.create(
        {
            historyUser: options.user!.id,
            id: instance.getDataValue('id'),
            username: instance.getDataValue('username'),
            firstName: instance.getDataValue('firstName'),
            lastName: instance.getDataValue('lastName'),
            password: instance.getDataValue('password'),
            admin: instance.getDataValue('admin'),
            createdAt: instance.getDataValue('createdAt'),
            updatedAt: instance.getDataValue('updatedAt'),
            deletedAt: instance.getDataValue('deletedAt'),
        },
        {
            transaction: options.transaction,
        },
    );
});
User.addHook('afterRestore', async (instance: Model<UserAttributes, UserCreationAttributes>, options: InstanceRestoreOptions) => {
    await UserHistory.create(
        {
            historyUser: options.user!.id,
            id: instance.getDataValue('id'),
            username: instance.getDataValue('username'),
            firstName: instance.getDataValue('firstName'),
            lastName: instance.getDataValue('lastName'),
            password: instance.getDataValue('password'),
            admin: instance.getDataValue('admin'),
            createdAt: instance.getDataValue('createdAt'),
            updatedAt: instance.getDataValue('updatedAt'),
            deletedAt: instance.getDataValue('deletedAt'),
        },
        {
            transaction: options.transaction,
        },
    );
});

export interface UserHistoryAttributes {
    historyId: number;
    historyUser: string;
    id: string;
    username: string;
    firstName: string;
    lastName: string;
    password: string;
    admin: boolean;
    createdAt: Date;
    updatedAt: Date;
    deletedAt?: Date;
}

interface UserHistoryCreationAttributes {
    historyUser: string;
    id: string;
    username: string;
    firstName: string;
    lastName: string;
    password: string;
    admin: boolean;
    createdAt: Date;
    updatedAt: Date;
    deletedAt?: Date;
}

export class UserHistory extends Model<UserHistoryAttributes, UserHistoryCreationAttributes> implements UserHistoryAttributes {
    public historyId!: number;
    public historyUser!: string;

    public id!: string;
    public username!: string;
    public firstName!: string;
    public lastName!: string;
    public password!: string;
    public admin!: boolean;

    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
    public readonly deletedAt?: Date;
}

UserHistory.init(
    {
        historyId: {
            type: DataTypes.BIGINT,
            allowNull: false,
            primaryKey: true,
            autoIncrement: true,
            unique: true
        },
        historyUser: {
            type: DataTypes.UUID,
            allowNull: false,
        },
        id: {
            type: DataTypes.UUID,
            allowNull: false,
        },
        username: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: {
                name: 'username',
                msg: 'Must be unique'
            },
            validate: {
                notNull: {
                    msg: 'Required',
                },
                notEmpty: {
                    msg: 'Must be non-empty'
                },
            },
        },
        firstName: {
            type: DataTypes.STRING,
            allowNull: false,
            validate: {
                notNull: {
                    msg: 'Required',
                },
                notEmpty: {
                    msg: 'Must be non-empty'
                },
            },
        },
        lastName: {
            type: DataTypes.STRING,
            allowNull: false,
            validate: {
                notNull: {
                    msg: 'Required',
                },
                notEmpty: {
                    msg: 'Must be non-empty'
                },
            },
        },
        password: {
            type: DataTypes.STRING,
            allowNull: false,
            validate: {
                notNull: {
                    msg: 'Required',
                },
                notEmpty: {
                    msg: 'Must be non-empty'
                },
            },
        },
        admin: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
            allowNull: false,
            validate: {
                notNull: {
                    msg: 'Required',
                },
            },
        },
        createdAt: {
            type: DataTypes.DATE,
            allowNull: false,
        },
        updatedAt: {
            type: DataTypes.DATE,
            allowNull: false,
        },
        deletedAt: {
            type: DataTypes.DATE,
            allowNull: true,
        },
    },
    {
        tableName: 'user_histories',
        timestamps: false,
        indexes: [
            {
                fields: ['id', 'createdAt'],
            },
        ],
        sequelize: sequelize,
    }
);

export interface AuthTokenAttributes {
    id: string;
    user: string;
}

export interface AuthTokenCreationAttributes {
    user: string;
}

export class AuthToken extends Model<AuthTokenAttributes, AuthTokenCreationAttributes> implements AuthTokenAttributes {
    public id!: string;
    public user!: string;

    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;

    public readonly User?: User;
}

AuthToken.init(
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            allowNull: false,
            primaryKey: true,
            unique: true,
        },
        user: {
            type: DataTypes.UUID,
            allowNull: false,
        },
    },
    {
        tableName: 'auth_tokens',
        sequelize: sequelize,
    }
);

export interface UnitAttributes {
    id: string;
    name: string;
    createdAt: Date;
    updatedAt: Date;
    deletedAt?: Date;
}

export interface UnitCreationAttributes {
    name: string;
}

export class Unit extends Model<UnitAttributes, UnitCreationAttributes> implements UnitAttributes {
    public id!: string;
    public name!: string;

    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
    public readonly deletedAt?: Date;
}

Unit.init(
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            allowNull: false,
            primaryKey: true,
            unique: true,
        },
        name: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: {
                name: 'name',
                msg: 'Must be unique'
            },
            validate: {
                notNull: {
                    msg: 'Required',
                },
                notEmpty: {
                    msg: 'Must be non-empty'
                },
            },
        },
        createdAt: {
            type: DataTypes.DATE,
            allowNull: false,
        },
        updatedAt: {
            type: DataTypes.DATE,
            allowNull: false,
        },
        deletedAt: {
            type: DataTypes.DATE,
            allowNull: true,
        },
    },
    {
        tableName: 'units',
        paranoid: true,
        indexes: [
            {
                fields: ['id', 'createdAt'],
            }
        ],
        sequelize: sequelize,
    },
);

Unit.addHook('afterSave', async (instance: Model<UnitAttributes, UnitCreationAttributes>, options: SaveOptions<UnitAttributes>) => {
    await UnitHistory.create(
        {
            historyUser: options.user!.id,
            id: instance.getDataValue('id'),
            name: instance.getDataValue('name'),
            createdAt: instance.getDataValue('createdAt'),
            updatedAt: instance.getDataValue('updatedAt'),
            deletedAt: instance.getDataValue('deletedAt'),
        },
        {
            transaction: options.transaction,
        },
    );
});
Unit.addHook('afterDestroy', async (instance: Model<UnitAttributes, UnitCreationAttributes>, options: InstanceDestroyOptions) => {
    await UnitHistory.create(
        {
            historyUser: options.user!.id,
            id: instance.getDataValue('id'),
            name: instance.getDataValue('name'),
            createdAt: instance.getDataValue('createdAt'),
            updatedAt: instance.getDataValue('updatedAt'),
            deletedAt: instance.getDataValue('deletedAt'),
        },
        {
            transaction: options.transaction,
        },
    );
});
Unit.addHook('afterRestore', async (instance: Model<UnitAttributes, UnitCreationAttributes>, options: InstanceRestoreOptions) => {
    await UnitHistory.create(
        {
            historyUser: options.user!.id,
            id: instance.getDataValue('id'),
            name: instance.getDataValue('name'),
            createdAt: instance.getDataValue('createdAt'),
            updatedAt: instance.getDataValue('updatedAt'),
            deletedAt: instance.getDataValue('deletedAt'),
        },
        {
            transaction: options.transaction,
        },
    );
});

export interface UnitHistoryAttributes {
    historyId: number;
    historyUser: string;
    id: string;
    name: string;
    createdAt: Date;
    updatedAt: Date;
    deletedAt?: Date;
}

interface UnitHistoryCreationAttributes {
    historyUser: string;
    id: string;
    name: string;
    createdAt: Date;
    updatedAt: Date;
    deletedAt?: Date;
}

export class UnitHistory extends Model<UnitHistoryAttributes, UnitHistoryCreationAttributes> implements UnitHistoryAttributes {
    public historyId!: number;
    public historyUser!: string;

    public id!: string;
    public name!: string;

    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
    public readonly deletedAt?: Date;
}

UnitHistory.init(
    {
        historyId: {
            type: DataTypes.BIGINT,
            allowNull: false,
            primaryKey: true,
            autoIncrement: true,
            unique: true
        },
        historyUser: {
            type: DataTypes.UUID,
            allowNull: false,
        },
        id: {
            type: DataTypes.UUID,
            allowNull: false,
        },
        name: {
            type: DataTypes.STRING,
            allowNull: false,
            validate: {
                notNull: {
                    msg: 'Required',
                },
                notEmpty: {
                    msg: 'Must be non-empty'
                },
            },
        },
        createdAt: {
            type: DataTypes.DATE,
            allowNull: false,
        },
        updatedAt: {
            type: DataTypes.DATE,
            allowNull: false,
        },
        deletedAt: {
            type: DataTypes.DATE,
            allowNull: true,
        },
    },
    {
        tableName: 'unit_histories',
        timestamps: false,
        indexes: [
            {
                fields: ['id', 'createdAt'],
            }
        ],
        sequelize: sequelize,
    },
);

export interface CategoryAttributes {
    id: string;
    name: string;
    createdAt: Date;
    updatedAt: Date;
    deletedAt?: Date;
}

export interface CategoryCreationAttributes {
    name: string;
}

export class Category extends Model<CategoryAttributes, CategoryCreationAttributes> implements CategoryAttributes {
    public id!: string;
    public name!: string;

    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
    public readonly deletedAt?: Date;
}

Category.init(
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            allowNull: false,
            primaryKey: true,
            unique: true,
        },
        name: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: {
                name: 'name',
                msg: 'Must be unique'
            },
            validate: {
                notNull: {
                    msg: 'Required',
                },
                notEmpty: {
                    msg: 'Must be non-empty'
                },
            },
        },
        createdAt: {
            type: DataTypes.DATE,
            allowNull: false,
        },
        updatedAt: {
            type: DataTypes.DATE,
            allowNull: false,
        },
        deletedAt: {
            type: DataTypes.DATE,
            allowNull: true,
        },
    },
    {
        tableName: 'categories',
        paranoid: true,
        indexes: [
            {
                fields: ['id', 'createdAt'],
            }
        ],
        sequelize: sequelize,
    },
);

Category.addHook('afterSave', async (instance: Model<CategoryAttributes, CategoryCreationAttributes>, options: SaveOptions<CategoryAttributes>) => {
    await CategoryHistory.create(
        {
            historyUser: options.user!.id,
            id: instance.getDataValue('id'),
            name: instance.getDataValue('name'),
            createdAt: instance.getDataValue('createdAt'),
            updatedAt: instance.getDataValue('updatedAt'),
            deletedAt: instance.getDataValue('deletedAt'),
        },
        {
            transaction: options.transaction,
        },
    );
});
Category.addHook('afterDestroy', async (instance: Model<CategoryAttributes, CategoryCreationAttributes>, options: InstanceDestroyOptions) => {
    await CategoryHistory.create(
        {
            historyUser: options.user!.id,
            id: instance.getDataValue('id'),
            name: instance.getDataValue('name'),
            createdAt: instance.getDataValue('createdAt'),
            updatedAt: instance.getDataValue('updatedAt'),
            deletedAt: instance.getDataValue('deletedAt'),
        },
        {
            transaction: options.transaction,
        },
    );
});
Category.addHook('afterRestore', async (instance: Model<CategoryAttributes, CategoryCreationAttributes>, options: InstanceRestoreOptions) => {
    await CategoryHistory.create(
        {
            historyUser: options.user!.id,
            id: instance.getDataValue('id'),
            name: instance.getDataValue('name'),
            createdAt: instance.getDataValue('createdAt'),
            updatedAt: instance.getDataValue('updatedAt'),
            deletedAt: instance.getDataValue('deletedAt'),
        },
        {
            transaction: options.transaction,
        },
    );
});

export interface CategoryHistoryAttributes {
    historyId: number;
    historyUser: string;
    id: string;
    name: string;
    createdAt: Date;
    updatedAt: Date;
    deletedAt?: Date;
}

interface CategoryHistoryCreationAttributes {
    historyUser: string;
    id: string;
    name: string;
    createdAt: Date;
    updatedAt: Date;
    deletedAt?: Date;
}

export class CategoryHistory extends Model<CategoryHistoryAttributes, CategoryHistoryCreationAttributes> implements CategoryHistoryAttributes {
    public historyId!: number;
    public historyUser!: string;

    public id!: string;
    public name!: string;

    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
    public readonly deletedAt?: Date;
}

CategoryHistory.init(
    {
        historyId: {
            type: DataTypes.BIGINT,
            allowNull: false,
            primaryKey: true,
            autoIncrement: true,
            unique: true
        },
        historyUser: {
            type: DataTypes.UUID,
            allowNull: false,
        },
        id: {
            type: DataTypes.UUID,
            allowNull: false,
        },
        name: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true,
            validate: {
                notNull: {
                    msg: 'Required',
                },
                notEmpty: {
                    msg: 'Must be non-empty'
                },
            },
        },
        createdAt: {
            type: DataTypes.DATE,
            allowNull: false,
        },
        updatedAt: {
            type: DataTypes.DATE,
            allowNull: false,
        },
        deletedAt: {
            type: DataTypes.DATE,
            allowNull: true,
        },
    },
    {
        tableName: 'category_histories',
        timestamps: false,
        indexes: [
            {
                fields: ['id', 'createdAt'],
            }
        ],
        sequelize: sequelize,
    },
);

export interface ItemAttributes {
    id: string;
    name: string;
    safetyStock: number;
    stock: number;
    remarks: string;
    unit: string;
    category: string;
    createdAt: Date;
    updatedAt: Date;
    deletedAt?: Date;
}

export interface ItemCreationAttributes {
    name: string;
    safetyStock: number;
    stock: number;
    remarks: string;
    unit: string;
    category: string;
}

export class Item extends Model<ItemAttributes, ItemCreationAttributes> implements ItemAttributes {
    public id!: string;
    public name!: string;
    public safetyStock!: number;
    public stock!: number;
    public remarks!: string;
    public unit!: string;
    public category!: string;

    public readonly createdAt!: Date;
    public updatedAt!: Date;
    public readonly deletedAt?: Date;

    public readonly Unit?: Unit;
    public readonly Category?: Category;
}

Item.init(
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            allowNull: false,
            primaryKey: true,
            unique: true,
        },
        name: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: {
                name: 'name',
                msg: 'Must be unique',
            },
            validate: {
                notNull: {
                    msg: 'Required',
                },
                notEmpty: {
                    msg: 'Must be non-empty'
                },
            },
        },
        safetyStock: {
            type: DataTypes.INTEGER,
            allowNull: false,
            validate: {
                notNull: {
                    msg: 'Required',
                },
                isNumeric: {
                    msg: 'Must a number',
                },
                min: {
                    msg: 'Must be non-negative',
                    args: [0],
                },
            },
        },
        stock: {
            type: DataTypes.INTEGER,
            allowNull: false,
            validate: {
                notNull: {
                    msg: 'Required',
                },
                isNumeric: {
                    msg: 'Must a number',
                },
                min: {
                    msg: 'Must be non-negative',
                    args: [0],
                },
            },
        },
        remarks: {
            type: DataTypes.TEXT,
            allowNull: false,
            validate: {
                notNull: {
                    msg: 'Required',
                },
            }
        },
        unit: {
            type: DataTypes.UUID,
            allowNull: false,
            validate: {
                notNull: {
                    msg: 'Required',
                },
            }
        },
        category: {
            type: DataTypes.UUID,
            allowNull: false,
            validate: {
                notNull: {
                    msg: 'Required',
                },
            }
        },
        createdAt: {
            type: DataTypes.DATE,
            allowNull: false,
        },
        updatedAt: {
            type: DataTypes.DATE,
            allowNull: false,
        },
        deletedAt: {
            type: DataTypes.DATE,
            allowNull: true,
        },
    },
    {
        tableName: 'items',
        paranoid: true,
        indexes: [
            {
                fields: ['id', 'createdAt'],
            }
        ],
        sequelize: sequelize,
    },
);

Item.addHook('afterSave', async (instance: Model<ItemAttributes, ItemCreationAttributes>, options: SaveOptions<ItemAttributes>) => {
    await ItemHistory.create(
        {
            historyUser: options.user!.id,
            id: instance.getDataValue('id'),
            name: instance.getDataValue('name'),
            safetyStock: instance.getDataValue('safetyStock'),
            stock: instance.getDataValue('stock'),
            remarks: instance.getDataValue('remarks'),
            unit: instance.getDataValue('unit'),
            category: instance.getDataValue('category'),
            createdAt: instance.getDataValue('createdAt'),
            updatedAt: instance.getDataValue('updatedAt'),
            deletedAt: instance.getDataValue('deletedAt'),
        },
        {
            transaction: options.transaction,
        },
    );
});
Item.addHook('afterDestroy', async (instance: Model<ItemAttributes, ItemCreationAttributes>, options: InstanceDestroyOptions) => {
    await ItemHistory.create(
        {
            historyUser: options.user!.id,
            id: instance.getDataValue('id'),
            name: instance.getDataValue('name'),
            safetyStock: instance.getDataValue('safetyStock'),
            stock: instance.getDataValue('stock'),
            remarks: instance.getDataValue('remarks'),
            unit: instance.getDataValue('unit'),
            category: instance.getDataValue('category'),
            createdAt: instance.getDataValue('createdAt'),
            updatedAt: instance.getDataValue('updatedAt'),
            deletedAt: instance.getDataValue('deletedAt'),
        },
        {
            transaction: options.transaction,
        },
    );
});
Item.addHook('afterRestore', async (instance: Model<ItemAttributes, ItemCreationAttributes>, options: InstanceRestoreOptions) => {
    await ItemHistory.create(
        {
            historyUser: options.user!.id,
            id: instance.getDataValue('id'),
            name: instance.getDataValue('name'),
            safetyStock: instance.getDataValue('safetyStock'),
            stock: instance.getDataValue('stock'),
            remarks: instance.getDataValue('remarks'),
            unit: instance.getDataValue('unit'),
            category: instance.getDataValue('category'),
            createdAt: instance.getDataValue('createdAt'),
            updatedAt: instance.getDataValue('updatedAt'),
            deletedAt: instance.getDataValue('deletedAt'),
        },
        {
            transaction: options.transaction,
        },
    );
});

export interface ItemHistoryAttributes {
    historyId: number;
    historyUser: string;
    id: string;
    name: string;
    safetyStock: number;
    stock: number;
    remarks: string;
    unit: string;
    category: string;
    createdAt: Date;
    updatedAt: Date;
    deletedAt?: Date;
}

interface ItemHistoryCreationAttributes {
    historyUser: string;
    id: string;
    name: string;
    safetyStock: number;
    stock: number;
    remarks: string;
    unit: string;
    category: string;
    createdAt: Date;
    updatedAt: Date;
    deletedAt?: Date;
}

export class ItemHistory extends Model<ItemHistoryAttributes, ItemHistoryCreationAttributes> implements ItemHistoryAttributes {
    public historyId!: number;
    public historyUser!: string;

    public id!: string;
    public name!: string;
    public safetyStock!: number;
    public stock!: number;
    public remarks!: string;
    public unit!: string;
    public category!: string;

    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
    public readonly deletedAt?: Date;

    public readonly Unit?: Unit;
    public readonly Category?: Category;
}

ItemHistory.init(
    {
        historyId: {
            type: DataTypes.BIGINT,
            allowNull: false,
            primaryKey: true,
            autoIncrement: true,
            unique: true
        },
        historyUser: {
            type: DataTypes.UUID,
            allowNull: false,
        },
        id: {
            type: DataTypes.UUID,
            allowNull: false,
        },
        name: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true,
            validate: {
                notNull: {
                    msg: 'Required',
                },
                notEmpty: {
                    msg: 'Must be non-empty'
                },
            },
        },
        safetyStock: {
            type: DataTypes.INTEGER,
            allowNull: false,
            validate: {
                notNull: {
                    msg: 'Required',
                },
                isNumeric: {
                    msg: 'Must a number',
                },
                min: {
                    msg: 'Must be non-negative',
                    args: [0],
                },
            },
        },
        stock: {
            type: DataTypes.INTEGER,
            allowNull: false,
            validate: {
                notNull: {
                    msg: 'Required',
                },
                isNumeric: {
                    msg: 'Must a number',
                },
                min: {
                    msg: 'Must be non-negative',
                    args: [0],
                },
            },
        },
        remarks: {
            type: DataTypes.TEXT,
            allowNull: false,
            validate: {
                notNull: {
                    msg: 'Required',
                },
            }
        },
        unit: {
            type: DataTypes.UUID,
            allowNull: false,
            validate: {
                notNull: {
                    msg: 'Required',
                },
            }
        },
        category: {
            type: DataTypes.UUID,
            allowNull: false,
            validate: {
                notNull: {
                    msg: 'Required',
                },
            }
        },
        createdAt: {
            type: DataTypes.DATE,
            allowNull: false,
        },
        updatedAt: {
            type: DataTypes.DATE,
            allowNull: false,
        },
        deletedAt: {
            type: DataTypes.DATE,
            allowNull: true,
        },
    },
    {
        tableName: 'item_histories',
        timestamps: false,
        indexes: [
            {
                fields: ['id', 'createdAt'],
            }
        ],
        sequelize: sequelize,
    },
);

export interface TransactionAttributes {
    id: string;
    inTransaction: string | null;
    outTransaction: string | null;
    createdAt: Date;
    updatedAt: Date;
}

export interface TransactionCreationAttributes {
    inTransaction: string | null;
    outTransaction: string | null;
    createdAt: Date;
    updatedAt: Date;
}

export class Transaction extends Model<TransactionAttributes, TransactionCreationAttributes> implements TransactionAttributes {
    public id!: string;
    public inTransaction!: string | null;
    public outTransaction!: string | null;

    public readonly createdAt!: Date;
    public updatedAt!: Date;

    public readonly InTransaction?: InTransaction;
    public readonly OutTransaction?: OutTransaction;
}

Transaction.init(
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            allowNull: false,
            primaryKey: true,
            unique: true,
        },
        inTransaction: {
            type: DataTypes.UUID,
            allowNull: true,
            unique: {
                name: 'inTransaction',
                msg: 'Must be unique'
            },
        },
        outTransaction: {
            type: DataTypes.UUID,
            allowNull: true,
            unique: {
                name: 'outTransaction',
                msg: 'Must be unique'
            },
        },
        createdAt: {
            type: DataTypes.DATE,
            allowNull: false,
        },
        updatedAt: {
            type: DataTypes.DATE,
            allowNull: false,
        },
    },
    {
        tableName: 'transactions',
        indexes: [
            {
                fields: ['id', 'createdAt'],
            }
        ],
        sequelize: sequelize,
    },
);

export interface InTransactionAttributes {
    id: string;
    supplier: string;
    deliveryReceipt: string | null;
    dateOfDeliveryReceipt: string | null;
    dateReceived: string | null;
    void: boolean;
    createdAt: Date;
    updatedAt: Date;
}

export interface InTransactionCreationAttributes {
    supplier: string;
    deliveryReceipt: string | null;
    dateOfDeliveryReceipt: string | null;
    dateReceived: string | null;
}

export class InTransaction extends Model<InTransactionAttributes, InTransactionCreationAttributes> implements InTransactionAttributes {
    public id!: string;
    public supplier!: string;
    public deliveryReceipt!: string | null;
    public dateOfDeliveryReceipt!: string | null;
    public dateReceived!: string | null;
    public void!: boolean;

    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;

    public readonly InTransfers?: InTransfer[];
}

InTransaction.init(
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            allowNull: false,
            primaryKey: true,
            unique: true,
        },
        supplier: {
            type: DataTypes.STRING,
            allowNull: false,
            validate: {
                notNull: {
                    msg: 'Required',
                },
                notEmpty: {
                    msg: 'Must be non-empty'
                },
            },
        },
        deliveryReceipt: {
            type: DataTypes.STRING,
            validate: {
                notEmpty: {
                    msg: 'Must be non-empty'
                },
            },
        },
        dateOfDeliveryReceipt: {
            type: DataTypes.DATEONLY,
            validate: {
                isDate: {
                    msg: 'Must be a valid date',
                    args: true,
                },
            },
        },
        dateReceived: {
            type: DataTypes.DATEONLY,
            validate: {
                isDate: {
                    msg: 'Must be a valid date',
                    args: true,
                },
            },
        },
        void: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
            allowNull: false,
            validate: {
                notNull: {
                    msg: 'Required',
                },
            },
        },
        createdAt: {
            type: DataTypes.DATE,
            allowNull: false,
        },
        updatedAt: {
            type: DataTypes.DATE,
            allowNull: false,
        },
    },
    {
        tableName: 'in_transactions',
        indexes: [
            {
                fields: ['id', 'createdAt'],
            }
        ],
        sequelize: sequelize,
    },
);

InTransaction.addHook('afterSave', async (instance: Model<InTransactionAttributes, InTransactionCreationAttributes>, options: SaveOptions<InTransactionAttributes>) => {
    await InTransactionHistory.create(
        {
            historyUser: options.user!.id,
            id: instance.getDataValue('id'),
            supplier: instance.getDataValue('supplier'),
            deliveryReceipt: instance.getDataValue('deliveryReceipt'),
            dateOfDeliveryReceipt: instance.getDataValue('dateOfDeliveryReceipt'),
            dateReceived: instance.getDataValue('dateReceived'),
            void: instance.getDataValue('void'),
            createdAt: instance.getDataValue('createdAt'),
            updatedAt: instance.getDataValue('updatedAt'),
        },
        {
            transaction: options.transaction,
        },
    );
});

export interface InTransactionHistoryAttributes {
    historyId: number;
    historyUser: string;
    id: string;
    supplier: string;
    deliveryReceipt: string | null;
    dateOfDeliveryReceipt: string | null;
    dateReceived: string | null;
    void: boolean;
    createdAt: Date;
    updatedAt: Date;
}

export interface InTransactionHistoryCreationAttributes {
    historyUser: string;
    id: string;
    supplier: string;
    deliveryReceipt: string | null;
    dateOfDeliveryReceipt: string | null;
    dateReceived: string | null;
    void: boolean;
    createdAt: Date;
    updatedAt: Date;
}

export class InTransactionHistory extends Model<InTransactionHistoryAttributes, InTransactionHistoryCreationAttributes> implements InTransactionHistoryAttributes {
    public historyId!: number;
    public historyUser!: string;

    public id!: string;
    public supplier!: string;
    public deliveryReceipt!: string | null;
    public dateOfDeliveryReceipt!: string | null;
    public dateReceived!: string | null;
    public void!: boolean;

    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;

    public readonly InTransfers?: InTransfer[];
}

InTransactionHistory.init(
    {
        historyId: {
            type: DataTypes.BIGINT,
            allowNull: false,
            primaryKey: true,
            autoIncrement: true,
            unique: true
        },
        historyUser: {
            type: DataTypes.UUID,
            allowNull: false,
        },
        id: {
            type: DataTypes.UUID,
            allowNull: false,
        },
        supplier: {
            type: DataTypes.STRING,
            allowNull: false,
            validate: {
                notNull: {
                    msg: 'Required',
                },
                notEmpty: {
                    msg: 'Must be non-empty'
                },
            },
        },
        deliveryReceipt: {
            type: DataTypes.STRING,
            validate: {
                notEmpty: {
                    msg: 'Must be non-empty'
                },
            },
        },
        dateOfDeliveryReceipt: {
            type: DataTypes.DATEONLY,
            validate: {
                isDate: {
                    msg: 'Must be a valid date',
                    args: true,
                },
            },
        },
        dateReceived: {
            type: DataTypes.DATEONLY,
            validate: {
                isDate: {
                    msg: 'Must be a valid date',
                    args: true,
                },
            },
        },
        void: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            validate: {
                notNull: {
                    msg: 'Required',
                },
            },
        },
        createdAt: {
            type: DataTypes.DATE,
            allowNull: false,
        },
        updatedAt: {
            type: DataTypes.DATE,
            allowNull: false,
        },
    },
    {
        tableName: 'in_transaction_histories',
        timestamps: false,
        indexes: [
            {
                fields: ['id', 'createdAt'],
            }
        ],
        sequelize: sequelize,
    },
);

export interface OutTransactionAttributes {
    id: string;
    customer: string;
    deliveryReceipt: string | null;
    dateOfDeliveryReceipt: string | null;
    void: boolean;
    createdAt: Date;
    updatedAt: Date;
}

export interface OutTransactionCreationAttributes {
    customer: string;
    deliveryReceipt: string | null;
    dateOfDeliveryReceipt: string | null;
}

export class OutTransaction extends Model<OutTransactionAttributes, OutTransactionCreationAttributes> implements OutTransactionAttributes {
    public id!: string;
    public customer!: string;
    public deliveryReceipt!: string | null;
    public dateOfDeliveryReceipt!: string | null;
    public void!: boolean;

    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;

    public readonly OutTransfers?: OutTransfer[];
}

OutTransaction.init(
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            allowNull: false,
            primaryKey: true,
            unique: true,
        },
        customer: {
            type: DataTypes.STRING,
            allowNull: false,
            validate: {
                notNull: {
                    msg: 'Required',
                },
                notEmpty: {
                    msg: 'Must be non-empty'
                },
            },
        },
        deliveryReceipt: {
            type: DataTypes.STRING,
            validate: {
                notEmpty: {
                    msg: 'Must be non-empty'
                },
            },
        },
        dateOfDeliveryReceipt: {
            type: DataTypes.DATEONLY,
            validate: {
                isDate: {
                    msg: 'Must be a valid date',
                    args: true,
                },
            },
        },
        void: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
            allowNull: false,
            validate: {
                notNull: {
                    msg: 'Required',
                },
            },
        },
        createdAt: {
            type: DataTypes.DATE,
            allowNull: false,
        },
        updatedAt: {
            type: DataTypes.DATE,
            allowNull: false,
        },
    },
    {
        tableName: 'out_transactions',
        indexes: [
            {
                fields: ['id', 'createdAt'],
            },
        ],
        sequelize: sequelize,
    },
);

OutTransaction.addHook('afterSave', async (instance: Model<OutTransactionAttributes, OutTransactionCreationAttributes>, options: SaveOptions<OutTransactionAttributes>) => {
    await OutTransactionHistory.create(
        {
            historyUser: options.user!.id,
            id: instance.getDataValue('id'),
            customer: instance.getDataValue('customer'),
            deliveryReceipt: instance.getDataValue('deliveryReceipt'),
            dateOfDeliveryReceipt: instance.getDataValue('dateOfDeliveryReceipt'),
            void: instance.getDataValue('void'),
            createdAt: instance.getDataValue('createdAt'),
            updatedAt: instance.getDataValue('updatedAt'),
        },
        {
            transaction: options.transaction,
        },
    );
});

export interface OutTransactionHistoryAttributes {
    historyId: number;
    historyUser: string;
    id: string;
    customer: string;
    deliveryReceipt: string | null;
    dateOfDeliveryReceipt: string | null;
    void: boolean;
    createdAt: Date;
    updatedAt: Date;
}

export interface OutTransactionHistoryCreationAttributes {
    historyUser: string;
    id: string;
    customer: string;
    deliveryReceipt: string | null;
    dateOfDeliveryReceipt: string | null;
    void: boolean;
    createdAt: Date;
    updatedAt: Date;
}

export class OutTransactionHistory extends Model<OutTransactionHistoryAttributes, OutTransactionHistoryCreationAttributes> implements OutTransactionHistoryAttributes {
    public historyId!: number;
    public historyUser!: string;

    public id!: string;
    public customer!: string;
    public deliveryReceipt!: string | null;
    public dateOfDeliveryReceipt!: string | null;
    public void!: boolean;

    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;

    public readonly OutTransfers?: OutTransfer[];
}

OutTransactionHistory.init(
    {
        historyId: {
            type: DataTypes.BIGINT,
            allowNull: false,
            primaryKey: true,
            autoIncrement: true,
            unique: true
        },
        historyUser: {
            type: DataTypes.UUID,
            allowNull: false,
        },
        id: {
            type: DataTypes.UUID,
            allowNull: false,
        },
        customer: {
            type: DataTypes.STRING,
            allowNull: false,
            validate: {
                notNull: {
                    msg: 'Required',
                },
                notEmpty: {
                    msg: 'Must be non-empty'
                },
            },
        },
        deliveryReceipt: {
            type: DataTypes.STRING,
            validate: {
                notEmpty: {
                    msg: 'Must be non-empty'
                },
            },
        },
        dateOfDeliveryReceipt: {
            type: DataTypes.DATEONLY,
            validate: {
                isDate: {
                    msg: 'Must be a valid date',
                    args: true,
                },
            },
        },
        void: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            validate: {
                notNull: {
                    msg: 'Required',
                },
            },
        },
        createdAt: {
            type: DataTypes.DATE,
            allowNull: false,
        },
        updatedAt: {
            type: DataTypes.DATE,
            allowNull: false,
        },
    },
    {
        tableName: 'out_transaction_histories',
        timestamps: false,
        indexes: [
            {
                fields: ['id', 'createdAt'],
            },
        ],
        sequelize: sequelize,
    },
);

export interface TransferAttributes {
    id: string;
    inTransfer: string | null;
    outTransfer: string | null;
    createdAt: Date;
    updatedAt: Date;
}

export interface TransferCreationAttributes {
    inTransfer: string | null;
    outTransfer: string | null;
    createdAt: Date;
    updatedAt: Date;
}

export class Transfer extends Model<TransferAttributes, TransferCreationAttributes> implements TransferAttributes {
    public id!: string;
    public inTransfer!: string | null;
    public outTransfer!: string | null;

    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;

    public readonly InTransfer?: InTransfer;
    public readonly OutTransfer?: OutTransfer;
}

Transfer.init(
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            allowNull: false,
            primaryKey: true,
            unique: true,
        },
        inTransfer: {
            type: DataTypes.UUID,
            allowNull: true,
            unique: {
                name: 'inTransfer',
                msg: 'Must be unique'
            },
        },
        outTransfer: {
            type: DataTypes.UUID,
            allowNull: true,
            unique: {
                name: 'outTransfer',
                msg: 'Must be unique'
            },
        },
        createdAt: {
            type: DataTypes.DATE,
            allowNull: false,
        },
        updatedAt: {
            type: DataTypes.DATE,
            allowNull: false,
        },
    },
    {
        tableName: 'transfers',
        indexes: [
            {
                fields: ['inTransfer', 'outTransfer', 'createdAt'],
            }
        ],
        sequelize: sequelize,
    },
);

export interface InTransferAttributes {
    id: string;
    item: string;
    transaction: string;
    quantity: number;
    createdAt: Date;
    updatedAt: Date;
    // readonly Item?: Item;
}

export interface InTransferCreationAttributes {
    item: string;
    transaction: string;
    quantity: number;
    createdAt: Date;
    updatedAt: Date;
}

export class InTransfer extends Model<InTransferAttributes, InTransferCreationAttributes> implements InTransferAttributes {
    public id!: string;
    public item!: string;
    public transaction!: string;
    public quantity!: number;

    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;

    public readonly InTransaction?: InTransaction;
    public readonly Item?: Item;
}

InTransfer.init(
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            allowNull: false,
            primaryKey: true,
            unique: true,
        },
        item: {
            type: DataTypes.UUID,
            allowNull: false,
            validate: {
                notNull: {
                    msg: 'Required',
                },
            },
        },
        transaction: {
            type: DataTypes.UUID,
            allowNull: false,
            validate: {
                notNull: {
                    msg: 'Required',
                },
            },
        },
        quantity: {
            type: DataTypes.INTEGER,
            allowNull: false,
            validate: {
                notNull: {
                    msg: 'Required',
                },
                isNumeric: {
                    msg: 'Must a number',
                },
                min: {
                    msg: 'Must be positive',
                    args: [1],
                },
            },
        },
        createdAt: {
            type: DataTypes.DATE,
            allowNull: false,
        },
        updatedAt: {
            type: DataTypes.DATE,
            allowNull: false,
        },
    },
    {
        tableName: 'in_transfers',
        indexes: [
            {
                unique: true,
                fields: ['transaction', 'item'],
            },
            {
                fields: ['id', 'createdAt'],
            },
        ],
        sequelize: sequelize,
    },
);

export interface OutTransferAttributes {
    id: string;
    item: string;
    transaction: string;
    quantity: number;
    createdAt: Date;
    updatedAt: Date;
    // readonly Item?: Item;
}

export interface OutTransferCreationAttributes {
    item: string;
    transaction: string;
    quantity: number;
    createdAt: Date;
    updatedAt: Date;
}

export class OutTransfer extends Model<OutTransferAttributes, OutTransferCreationAttributes> implements OutTransferAttributes {
    public id!: string;
    public item!: string;
    public transaction!: string;
    public quantity!: number;

    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;

    public readonly OutTransaction?: OutTransaction;
    public readonly Item?: Item;
}

OutTransfer.init(
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            allowNull: false,
            primaryKey: true,
            unique: true,
        },
        item: {
            type: DataTypes.UUID,
            allowNull: false,
            validate: {
                notNull: {
                    msg: 'Required',
                },
            },
        },
        transaction: {
            type: DataTypes.UUID,
            allowNull: false,
            validate: {
                notNull: {
                    msg: 'Required',
                },
            },
        },
        quantity: {
            type: DataTypes.INTEGER,
            allowNull: false,
            validate: {
                notNull: {
                    msg: 'Required',
                },
                isNumeric: {
                    msg: 'Must a number',
                },
                min: {
                    msg: 'Must be positive',
                    args: [1],
                },
            },
        },
        createdAt: {
            type: DataTypes.DATE,
            allowNull: false,
        },
        updatedAt: {
            type: DataTypes.DATE,
            allowNull: false,
        },
    },
    {
        tableName: 'out_transfers',
        indexes: [
            {
                unique: true,
                fields: ['transaction', 'item'],
            },

            {
                fields: ['id', 'createdAt'],
            },
        ],
        sequelize: sequelize,
    },
);

User.hasMany(AuthToken, {
    foreignKey: {
        name: 'user',
        allowNull: false,
    },
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE'
});
AuthToken.belongsTo(User,
    {
        foreignKey: {
            name: 'user',
            allowNull: false,
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
    }
);

Unit.hasMany(Item, {
    foreignKey: {
        name: 'unit',
        allowNull: false,
    },
    onDelete: 'RESTRICT',
    onUpdate: 'CASCADE'
});
Item.belongsTo(Unit,
    {
        foreignKey: {
            name: 'unit',
            allowNull: false,
        },
        onDelete: 'RESTRICT',
        onUpdate: 'CASCADE'
    }
);

Unit.hasMany(ItemHistory, {
    foreignKey: {
        name: 'unit',
        allowNull: false,
    },
    onDelete: 'RESTRICT',
    onUpdate: 'CASCADE'
});
ItemHistory.belongsTo(Unit,
    {
        foreignKey: {
            name: 'unit',
            allowNull: false,
        },
        onDelete: 'RESTRICT',
        onUpdate: 'CASCADE'
    }
);

Category.hasMany(Item, {
    foreignKey: {
        name: 'category',
        allowNull: false,
    },
    onDelete: 'RESTRICT',
    onUpdate: 'CASCADE'
});
Item.belongsTo(Category,
    {
        foreignKey: {
            name: 'category',
            allowNull: false,
        },
        onDelete: 'RESTRICT',
        onUpdate: 'CASCADE'
    }
);

Category.hasMany(ItemHistory, {
    foreignKey: {
        name: 'category',
        allowNull: false,
    },
    onDelete: 'RESTRICT',
    onUpdate: 'CASCADE'
});
ItemHistory.belongsTo(Category,
    {
        foreignKey: {
            name: 'category',
            allowNull: false,
        },
        onDelete: 'RESTRICT',
        onUpdate: 'CASCADE'
    }
);

InTransaction.hasOne(Transaction, {
    foreignKey: {
        name: 'inTransaction',
    },
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE'
});
Transaction.belongsTo(InTransaction, {
    foreignKey: {
        name: 'inTransaction',
    },
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE'
});

OutTransaction.hasOne(Transaction, {
    foreignKey: {
        name: 'outTransaction',
    },
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE'
});
Transaction.belongsTo(OutTransaction, {
    foreignKey: {
        name: 'outTransaction',
    },
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE'
});

InTransaction.hasMany(InTransfer, {
    foreignKey: {
        name: 'transaction',
        allowNull: false,
    },
    onDelete: 'RESTRICT',
    onUpdate: 'CASCADE'
});
InTransfer.belongsTo(InTransaction, {
    foreignKey: {
        name: 'transaction',
        allowNull: false,
    },
    onDelete: 'RESTRICT',
    onUpdate: 'CASCADE'
});

OutTransaction.hasMany(OutTransfer, {
    foreignKey: {
        name: 'transaction',
        allowNull: false,
    },
    onDelete: 'RESTRICT',
    onUpdate: 'CASCADE'
});
OutTransfer.belongsTo(OutTransaction, {
    foreignKey: {
        name: 'transaction',
        allowNull: false,
    },
    onDelete: 'RESTRICT',
    onUpdate: 'CASCADE'
});

InTransfer.hasOne(Transfer, {
    foreignKey: {
        name: 'inTransfer',
    },
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE'
});
Transfer.belongsTo(InTransfer, {
    foreignKey: {
        name: 'inTransfer',
    },
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE'
});

OutTransfer.hasOne(Transfer, {
    foreignKey: {
        name: 'outTransfer',
    },
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE'
});
Transfer.belongsTo(OutTransfer, {
    foreignKey: {
        name: 'outTransfer',
    },
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE'
});

Item.hasMany(InTransfer, {
    foreignKey: {
        name: 'item',
        allowNull: false,
    },
    onDelete: 'RESTRICT',
    onUpdate: 'CASCADE'
});
InTransfer.belongsTo(Item, {
    foreignKey: {
        name: 'item',
        allowNull: false,
    },
    onDelete: 'RESTRICT',
    onUpdate: 'CASCADE'
});

Item.hasMany(OutTransfer, {
    foreignKey: {
        name: 'item',
        allowNull: false,
    },
    onDelete: 'RESTRICT',
    onUpdate: 'CASCADE'
});
OutTransfer.belongsTo(Item, {
    foreignKey: {
        name: 'item',
        allowNull: false,
    },
    onDelete: 'RESTRICT',
    onUpdate: 'CASCADE'
});

export default sequelize;
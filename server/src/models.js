import { DataTypes, Model } from 'sequelize'
import { sequelize } from '../src/db.js'

export class User extends Model {}
User.init(
	{
		id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
		email: { type: DataTypes.STRING(255), allowNull: false, unique: true },
		fullName: { type: DataTypes.STRING(255), allowNull: false }
	},
	{ sequelize, tableName: 'users', timestamps: true, createdAt: 'created_at', updatedAt: false }
)

export class Account extends Model {}
Account.init(
	{
		id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
		userId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, unique: true },
		balance: { type: DataTypes.DECIMAL(18, 2), allowNull: false, defaultValue: '0.00' },
		currency: { type: DataTypes.STRING(3), allowNull: false, defaultValue: 'BDT' }
	},
	{ sequelize, tableName: 'accounts', timestamps: true, createdAt: false, updatedAt: 'updated_at' }
)

export class Transaction extends Model {}
Transaction.init(
	{
		id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
		accountId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
		type: { type: DataTypes.STRING(32), allowNull: false },
		amount: { type: DataTypes.DECIMAL(18, 2), allowNull: false },
		reference: { type: DataTypes.STRING(255), allowNull: true }
	},
	{ sequelize, tableName: 'transactions', timestamps: true, createdAt: 'created_at', updatedAt: false }
)

User.hasOne(Account, { foreignKey: 'userId', as: 'account' })
Account.belongsTo(User, { foreignKey: 'userId', as: 'user' })
Account.hasMany(Transaction, { foreignKey: 'accountId', as: 'transactions' })
Transaction.belongsTo(Account, { foreignKey: 'accountId', as: 'account' })



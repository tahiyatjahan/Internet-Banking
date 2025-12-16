import { DataTypes, Model } from 'sequelize'
import { sequelize } from '../src/db.js'

export class User extends Model {}
User.init(
	{
		id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
		email: { type: DataTypes.STRING(255), allowNull: false, unique: true },
		fullName: { type: DataTypes.STRING(255), allowNull: false },
		password: { type: DataTypes.STRING(255), allowNull: false }
	},
	{ sequelize, tableName: 'users', timestamps: true, createdAt: 'created_at', updatedAt: false }
)

export class Account extends Model {}
Account.init(
	{
		id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
		userId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, unique: true },
		accountNumber: { type: DataTypes.STRING(16), allowNull: false, unique: true },
		balance: { type: DataTypes.DECIMAL(18, 2), allowNull: false, defaultValue: '0.00' },
		currency: { type: DataTypes.STRING(3), allowNull: false, defaultValue: 'BDT' }
	},
	{ 
		sequelize, 
		tableName: 'accounts', 
		timestamps: true, 
		createdAt: false, 
		updatedAt: 'updated_at'
	}
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

export class Loan extends Model {}
Loan.init(
	{
		id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
		userId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
		amount: { type: DataTypes.DECIMAL(18, 2), allowNull: false },
		interestRate: { type: DataTypes.DECIMAL(5, 2), allowNull: false, defaultValue: '5.00' },
		totalAmount: { type: DataTypes.DECIMAL(18, 2), allowNull: false },
		status: { type: DataTypes.ENUM('PENDING', 'ACTIVE', 'REPAID', 'DEFAULTED'), allowNull: false, defaultValue: 'PENDING' },
		dueDate: { type: DataTypes.DATE, allowNull: false },
		repaidAt: { type: DataTypes.DATE, allowNull: true }
	},
	{ sequelize, tableName: 'loans', timestamps: true, createdAt: 'created_at', updatedAt: 'updated_at' }
)

export class MoneyRequest extends Model {}
MoneyRequest.init(
	{
		id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
		fromUserId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
		toUserId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
		amount: { type: DataTypes.DECIMAL(18, 2), allowNull: false },
		message: { type: DataTypes.STRING(500), allowNull: true },
		status: { type: DataTypes.ENUM('PENDING', 'ACCEPTED', 'REJECTED', 'CANCELLED'), allowNull: false, defaultValue: 'PENDING' }
	},
	{ sequelize, tableName: 'money_requests', timestamps: true, createdAt: 'created_at', updatedAt: 'updated_at' }
)

export class Notification extends Model {}
Notification.init(
	{
		id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
		userId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
		title: { type: DataTypes.STRING(255), allowNull: false },
		message: { type: DataTypes.TEXT, allowNull: false },
		type: { type: DataTypes.ENUM('TOPUP', 'TRANSFER', 'LOAN', 'REQUEST', 'GENERAL'), allowNull: false, defaultValue: 'GENERAL' },
		isRead: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false }
	},
	{ sequelize, tableName: 'notifications', timestamps: true, createdAt: 'created_at', updatedAt: 'updated_at' }
)

export class Payee extends Model {}
Payee.init(
	{
		id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
		userId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false }, // owner of the payee list entry
		payeeUserId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true }, // linked user if exists
		payeeAccountNumber: { type: DataTypes.STRING(16), allowNull: false },
		nickname: { type: DataTypes.STRING(255), allowNull: true }
	},
	{ sequelize, tableName: 'payees', timestamps: true, createdAt: 'created_at', updatedAt: 'updated_at' }
)

// Users can invest in businesses with monthly returns
export class BusinessInvestment extends Model {}
BusinessInvestment.init(
	{
		id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
		userId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
		businessName: { type: DataTypes.STRING(255), allowNull: false },
		amount: { type: DataTypes.DECIMAL(18, 2), allowNull: false },
		monthlyReturnRate: { type: DataTypes.DECIMAL(5, 2), allowNull: false, defaultValue: '2.00' }, // % per month
		termMonths: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, defaultValue: 12 },
		status: { type: DataTypes.ENUM('ACTIVE', 'COMPLETED', 'CANCELLED'), allowNull: false, defaultValue: 'ACTIVE' },
		investedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW }
	},
	{ sequelize, tableName: 'business_investments', timestamps: true, createdAt: 'created_at', updatedAt: 'updated_at' }
)

// Per-user transaction limits for security
export class TransactionLimit extends Model {}
TransactionLimit.init(
	{
		id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
		userId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, unique: true },
		// Maximum total outgoing amount per day (across supported channels). Null = no daily cap.
		dailyLimit: { type: DataTypes.DECIMAL(18, 2), allowNull: true },
		// Maximum amount for a single outgoing transaction. Null = no per-transaction cap.
		perTransactionLimit: { type: DataTypes.DECIMAL(18, 2), allowNull: true },
		// Internal tracking of how much has been used today
		usedToday: { type: DataTypes.DECIMAL(18, 2), allowNull: false, defaultValue: '0.00' },
		lastResetDate: { type: DataTypes.DATEONLY, allowNull: true }
	},
	{ sequelize, tableName: 'transaction_limits', timestamps: true, createdAt: 'created_at', updatedAt: 'updated_at' }
)

User.hasOne(Account, { foreignKey: 'userId', as: 'account' })
Account.belongsTo(User, { foreignKey: 'userId', as: 'user' })
Account.hasMany(Transaction, { foreignKey: 'accountId', as: 'transactions' })
Transaction.belongsTo(Account, { foreignKey: 'accountId', as: 'account' })
User.hasMany(Loan, { foreignKey: 'userId', as: 'loans' })
Loan.belongsTo(User, { foreignKey: 'userId', as: 'user' })
User.hasMany(MoneyRequest, { foreignKey: 'fromUserId', as: 'sentRequests' })
User.hasMany(MoneyRequest, { foreignKey: 'toUserId', as: 'receivedRequests' })
MoneyRequest.belongsTo(User, { foreignKey: 'fromUserId', as: 'fromUser' })
MoneyRequest.belongsTo(User, { foreignKey: 'toUserId', as: 'toUser' })
User.hasMany(Notification, { foreignKey: 'userId', as: 'notifications' })
Notification.belongsTo(User, { foreignKey: 'userId', as: 'user' })
User.hasMany(Payee, { foreignKey: 'userId', as: 'payees' })
Payee.belongsTo(User, { foreignKey: 'userId', as: 'owner' })
User.hasMany(BusinessInvestment, { foreignKey: 'userId', as: 'investments' })
BusinessInvestment.belongsTo(User, { foreignKey: 'userId', as: 'user' })
User.hasOne(TransactionLimit, { foreignKey: 'userId', as: 'transactionLimit' })
TransactionLimit.belongsTo(User, { foreignKey: 'userId', as: 'user' })



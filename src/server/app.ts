import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import express, { Router } from 'express';
import path from 'path';
import { errorHandlerMiddleware } from './middleware/error';
import morganMiddleware from './middleware/morgan';
import authRouter from './routes/api/auth';
import categoriesRouter from "./routes/api/categories";
import inTransactionsRouter from './routes/api/in-transactions';
import inTransfersRouter from './routes/api/in-transfers';
import itemsRouter from "./routes/api/items";
import outTransactionsRouter from './routes/api/out-transactions';
import outTransfersRouter from './routes/api/out-transfers';
import transactionsRouter from './routes/api/transactions';
import transfersRouter from './routes/api/transfers';
import unitsRouter from "./routes/api/units";
import usersRouter from './routes/api/users';
import sequelize from './sequelize';

dotenv.config();

// sequelize.sync();

var app = express();

app.use(morganMiddleware);

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public'), { maxAge: '1y' }));

const apiRouter = Router();
apiRouter.use("/", authRouter);
apiRouter.use("/users", usersRouter);
apiRouter.use("/units", unitsRouter);
apiRouter.use("/categories", categoriesRouter);
apiRouter.use("/items", itemsRouter);
apiRouter.use("/transactions", transactionsRouter);
apiRouter.use("/transfers", transfersRouter);
apiRouter.use("/in-transactions", inTransactionsRouter);
apiRouter.use("/in-transfers", inTransfersRouter);
apiRouter.use("/out-transactions", outTransactionsRouter);
apiRouter.use("/out-transfers", outTransfersRouter);
app.use('/api', apiRouter);

app.get('*', async function (req, res, next) {
    // if (req.url.startsWith('/api')) return next();
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.use(errorHandlerMiddleware);

export default app;
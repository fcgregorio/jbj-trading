import { NextFunction, Request, Response } from 'express';
import { AuthToken, User } from '../sequelize';

export async function loginRequiredMiddleware(req: Request, res: Response, next: NextFunction) {
    const authorization = req.header('authorization')!;
    if (authorization === undefined) return res.sendStatus(400);

    const parts = authorization.split(' ');
    if (!(parts[0] === 'Bearer' && parts.length === 2)) return res.sendStatus(400);

    const token = parts[1];
    const authToken = await AuthToken.findByPk(token, { include: [User] });

    if (authToken === null) return res.sendStatus(401);

    res.locals.token = authToken.id;
    res.locals.user = authToken.User;

    next();
};

export async function adminRequiredMiddleware(req: Request, res: Response, next: NextFunction) {
    const token = res.locals.token as string;
    const user = res.locals.user as User;

    if (!user.admin) return res.sendStatus(401);

    next();
};
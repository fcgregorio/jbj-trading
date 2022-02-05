import { NextFunction, Request, Response, Router } from "express";
import { loginRequiredMiddleware } from "../../middleware/auth";
import sequelize, { AuthToken, User } from "../../sequelize";

const router = Router();

router.post(
  "/login",
  async function (req: Request, res: Response, next: NextFunction) {
    try {
      const result = await sequelize.transaction(async (t) => {
        const user = await User.findOne({
          where: {
            username: req.body.username,
          },
          rejectOnEmpty: true,
          transaction: t,
        });

        if (!(await user.checkPassword(req.body.password))) {
          return res.sendStatus(401);
          //throw Error('Incorrect password.');
        }

        const token = await AuthToken.create(
          {
            user: user.id,
          },
          {
            transaction: t,
          }
        );

        res.status(200).json(token.id);
      });
    } catch (error: any) {
      next(error);
    }
  }
);

router.post(
  "/logout",
  loginRequiredMiddleware,
  async function (req: Request, res: Response, next: NextFunction) {
    try {
      const result = await sequelize.transaction(async (t) => {
        const token = await AuthToken.findByPk(res.locals.token, {
          rejectOnEmpty: true,
          transaction: t,
        });

        await token.destroy({ transaction: t });

        return token;
      });

      res.status(200).json(result.id);
    } catch (error: any) {
      next(error);
    }
  }
);

router.post(
  "/generate-password",
  async function (req: Request, res: Response, next: NextFunction) {
    try {
      const password = await User.generatePassword(req.body.password);

      res.status(200).json({ password: password });
    } catch (error: any) {
      next(error);
    }
  }
);

export default router;

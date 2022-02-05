import { NextFunction, Request, Response } from "express";
import { BaseError, EmptyResultError, ValidationError } from "sequelize";
import { AppValidationError } from "../errors";
import Logger from "../winston";

export function errorHandlerMiddleware(
  error: any,
  req: Request,
  res: Response,
  next: NextFunction
) {
  Logger.error(JSON.stringify(error, null, 4));

  if (res.headersSent) {
    return next(error);
  }

  if (error instanceof EmptyResultError) {
    res.status(404).send(error.message);
  } else if (
    error instanceof ValidationError ||
    error instanceof AppValidationError
  ) {
    res.status(422).json({
      errors: error.errors.map((item) => {
        return {
          message: item.message,
          path: item.path,
        };
      }),
    });
  } else if (error instanceof BaseError) {
    res.status(500).send(error.message);
  } else {
    res.sendStatus(500);
  }
}

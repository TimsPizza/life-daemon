import { ServiceResponse } from "@/common/models/serviceResponse";
import type { ErrorRequestHandler, RequestHandler } from "express";
import { StatusCodes } from "http-status-codes";
import { MongooseError } from "mongoose";
import { ZodError } from "zod";

const unexpectedRequest: RequestHandler = (_req, res) => {
  res.sendStatus(StatusCodes.NOT_FOUND);
};

const addErrorToRequestLog: ErrorRequestHandler = (err, _req, res, next) => {
  res.locals.err = err;
  next(err);
};
// Handle errors that occur during request processing
export const handleProcessError: ErrorRequestHandler = (
  err,
  _req,
  res,
  _next,
) => {
  console.error("Error:", err);

  if (err instanceof ZodError) {
    res.status(StatusCodes.BAD_REQUEST).json(
      ServiceResponse.failure(
        "Validation error",
        err.errors.map((e) => e.message),
        StatusCodes.BAD_REQUEST,
      ),
    );
    return;
  }

  if (err instanceof MongooseError) {
    res
      .status(StatusCodes.SERVICE_UNAVAILABLE)
      .json(
        ServiceResponse.failure(
          "Database error",
          err.message,
          StatusCodes.SERVICE_UNAVAILABLE,
        ),
      );
    return;
  }

  res
    .status(StatusCodes.INTERNAL_SERVER_ERROR)
    .json(
      ServiceResponse.failure(
        err.message || "Internal server error",
        process.env.NODE_ENV === "development" ? err.stack : null,
        StatusCodes.INTERNAL_SERVER_ERROR,
      ),
    );
};

export default () => [unexpectedRequest, addErrorToRequestLog];

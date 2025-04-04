import type { NextFunction, Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import type { ZodError, ZodSchema } from "zod";

import { ServiceResponse } from "@/common/models/serviceResponse";

export const handleServiceResponse = (
  serviceResponse: ServiceResponse<unknown>,
  response: Response,
) => {
  return response.status(serviceResponse.statusCode).send(serviceResponse);
};

type ValidateLocation = 'body' | 'query' | 'params';

interface ValidationConfig {
  schema: ZodSchema;
  location: ValidateLocation;
}

export const validateRequest = (config: ValidationConfig) => 
  (req: Request, res: Response, next: NextFunction) => {
    try {
      const dataToValidate = req[config.location];
      config.schema.parse(dataToValidate);
      next();
    } catch (err) {
      const errorMessage = `Invalid input: ${(err as ZodError).errors.map((e) => e.message).join(", ")}`;
      const statusCode = StatusCodes.BAD_REQUEST;
      const serviceResponse = ServiceResponse.failure(
        errorMessage,
        null,
        statusCode,
      );
      handleServiceResponse(serviceResponse, res);
    }
  };

import { RequestHandler } from 'express';
import { ZodSchema } from 'zod';
import { AppError } from '@/utils/app-error';
import mongoose from 'mongoose';

export type ValidateSource = 'body' | 'query' | 'params';

// TODO: ¿1: Hace falta un solo 'validate', que por medio de un atributo de valores múltiples, sea capaz de validar todo, o 2: varias funciones que validen por separado?

/**
 * 1: Haría falta un atributo de valores múltiples ('body', 'query', 'params'), que solo pudieran repetirse una vez, como un map de esos tres valores, que sean opcionales, pero no repetibles. Dentro de la función única, se harían todas las comprobaciones gracias a funciones externas. Si dentro del atributo se encuentra uno de los valores, se pasa dicha función.
 * 
 * 2. De esta forma se duplica código en el router, ya que hay que poner, en relación a los parámetros de la petición que se quieran analizar, cada una de las funciones sueltas.
 */

export const validate = (schema: ZodSchema, source: ValidateSource): RequestHandler => {
    return (req, _res, next) => {
        const result = schema.safeParse(req[source]);

        if (!result.success) {
            return next(
                new AppError(400, 'Error de validación', result.error.format())
            );
        };

        if (source === 'body') req[source] = result.data;
        next();
    };
};

export const validateBody = (schema: ZodSchema): RequestHandler => {
    return (req, _res, next) => {
        const result = schema.safeParse(req.body);

        if (!result.success) {
            return next(
                new AppError(400, 'Error de validación', result.error.format())
            );
        };

        req.body = result.data;
        next();
    };
};

export const validateParams = (schema: ZodSchema): RequestHandler => {
    return (req, _res, next) => {
        const result = schema.safeParse(req.params);

        if (!result.success) {
            return next(
                new AppError(400, 'Error de validación', result.error.format())
            );
        };

        next();
    };
};

export const validateQuery = (schema: ZodSchema): RequestHandler => {
    return (req, _res, next) => {
        const result = schema.safeParse(req.query);

        if (!result.success) {
            return next(
                new AppError(400, 'Error de validación', result.error.format())
            );
        };

        next();
    };
};

export const validateObjectID = (paramName: string): RequestHandler => {
    return (req, _res, next) => {
        const objectID = req.params[paramName];

        if (!mongoose.Types.ObjectId.isValid(objectID)) {
            return next(
                new AppError(400, 'Invalid ObjectID')
            );
        };

        next();
    };
};
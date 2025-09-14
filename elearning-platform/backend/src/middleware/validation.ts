import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import { AppError } from './errorHandler';

export const validate = (schema: Joi.ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const { error } = schema.validate(req.body, { abortEarly: false });
    
    if (error) {
      const errorMessages = error.details.map(detail => detail.message);
      throw new AppError(`Validation error: ${errorMessages.join(', ')}`, 400);
    }
    
    next();
  };
};

export const validateParams = (schema: Joi.ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const { error } = schema.validate(req.params, { abortEarly: false });
    
    if (error) {
      const errorMessages = error.details.map(detail => detail.message);
      throw new AppError(`Validation error: ${errorMessages.join(', ')}`, 400);
    }
    
    next();
  };
};

export const validateQuery = (schema: Joi.ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const { error } = schema.validate(req.query, { abortEarly: false });
    
    if (error) {
      const errorMessages = error.details.map(detail => detail.message);
      throw new AppError(`Validation error: ${errorMessages.join(', ')}`, 400);
    }
    
    next();
  };
};

// Common validation schemas
export const schemas = {
  register: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(8).required(),
    firstName: Joi.string().min(2).max(50).required(),
    lastName: Joi.string().min(2).max(50).required(),
    role: Joi.string().valid('STUDENT', 'TEACHER').optional(),
  }),

  login: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required(),
  }),

  createCourse: Joi.object({
    title: Joi.string().min(3).max(200).required(),
    description: Joi.string().min(10).required(),
    shortDescription: Joi.string().max(500).optional(),
    price: Joi.number().min(0).required(),
    categoryId: Joi.string().optional(),
  }),

  createLesson: Joi.object({
    title: Joi.string().min(3).max(200).required(),
    description: Joi.string().optional(),
    videoUrl: Joi.string().uri().optional(),
    duration: Joi.number().min(0).optional(),
    order: Joi.number().min(1).required(),
  }),

  createQuiz: Joi.object({
    title: Joi.string().min(3).max(200).required(),
    description: Joi.string().optional(),
    passingScore: Joi.number().min(0).max(100).optional(),
    timeLimit: Joi.number().min(1).optional(),
    questions: Joi.array().items(
      Joi.object({
        question: Joi.string().required(),
        type: Joi.string().valid('MULTIPLE_CHOICE', 'TRUE_FALSE', 'SHORT_ANSWER').required(),
        options: Joi.array().items(Joi.string()).optional(),
        correctAnswer: Joi.string().required(),
        points: Joi.number().min(1).optional(),
        order: Joi.number().min(1).required(),
      })
    ).min(1).required(),
  }),

  updateProgress: Joi.object({
    watchedTime: Joi.number().min(0).required(),
    isCompleted: Joi.boolean().optional(),
  }),

  submitQuiz: Joi.object({
    answers: Joi.object().required(),
  }),

  idParam: Joi.object({
    id: Joi.string().required(),
  }),

  pagination: Joi.object({
    page: Joi.number().min(1).optional(),
    limit: Joi.number().min(1).max(100).optional(),
    search: Joi.string().optional(),
    category: Joi.string().optional(),
    sortBy: Joi.string().optional(),
    sortOrder: Joi.string().valid('asc', 'desc').optional(),
  }),
};
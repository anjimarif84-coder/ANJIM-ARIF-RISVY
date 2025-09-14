import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';

export const validate = (schema: Joi.ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const { error } = schema.validate(req.body);
    
    if (error) {
      return res.status(400).json({
        success: false,
        error: error.details[0].message,
      });
    }
    
    next();
  };
};

// Validation schemas
export const schemas = {
  register: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(8).required(),
    firstName: Joi.string().min(2).max(50).required(),
    lastName: Joi.string().min(2).max(50).required(),
    role: Joi.string().valid('STUDENT', 'TEACHER', 'ADMIN').optional(),
  }),

  login: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required(),
  }),

  createCourse: Joi.object({
    title: Joi.string().min(3).max(200).required(),
    description: Joi.string().min(10).max(1000).required(),
    thumbnail: Joi.string().uri().optional(),
    price: Joi.number().min(0).required(),
    status: Joi.string().valid('DRAFT', 'PUBLISHED', 'ARCHIVED').optional(),
  }),

  updateCourse: Joi.object({
    title: Joi.string().min(3).max(200).optional(),
    description: Joi.string().min(10).max(1000).optional(),
    thumbnail: Joi.string().uri().optional(),
    price: Joi.number().min(0).optional(),
    status: Joi.string().valid('DRAFT', 'PUBLISHED', 'ARCHIVED').optional(),
  }),

  createLesson: Joi.object({
    title: Joi.string().min(3).max(200).required(),
    description: Joi.string().max(500).optional(),
    content: Joi.string().optional(),
    videoUrl: Joi.string().uri().optional(),
    duration: Joi.number().min(1).optional(),
    order: Joi.number().min(1).required(),
    type: Joi.string().valid('VIDEO', 'TEXT', 'QUIZ', 'ASSIGNMENT').required(),
  }),

  createQuiz: Joi.object({
    title: Joi.string().min(3).max(200).required(),
    description: Joi.string().max(500).optional(),
    questions: Joi.array().items(
      Joi.object({
        question: Joi.string().min(5).max(500).required(),
        type: Joi.string().valid('multiple_choice', 'true_false', 'text').required(),
        options: Joi.array().items(Joi.string()).optional(),
        correctAnswer: Joi.string().required(),
        points: Joi.number().min(1).optional(),
        order: Joi.number().min(1).required(),
      })
    ).min(1).required(),
  }),

  quizResponse: Joi.object({
    answers: Joi.object().pattern(
      Joi.string(),
      Joi.alternatives().try(
        Joi.string(),
        Joi.array().items(Joi.string())
      )
    ).required(),
  }),

  payment: Joi.object({
    courseId: Joi.string().required(),
    successUrl: Joi.string().uri().optional(),
    cancelUrl: Joi.string().uri().optional(),
  }),

  updateProfile: Joi.object({
    firstName: Joi.string().min(2).max(50).optional(),
    lastName: Joi.string().min(2).max(50).optional(),
    avatar: Joi.string().uri().optional(),
  }),

  changePassword: Joi.object({
    currentPassword: Joi.string().required(),
    newPassword: Joi.string().min(8).required(),
  }),
};
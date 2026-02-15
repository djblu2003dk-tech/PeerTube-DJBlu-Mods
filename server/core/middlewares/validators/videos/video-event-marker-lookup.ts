import express from 'express'
import { query } from 'express-validator'
import { areValidationErrors } from '../shared/index.js'

export const searchApiFootballTeamsValidator = [
  query('search')
    .isString()
    .isLength({ min: 2, max: 80 })
    .withMessage('Search must be between 2 and 80 characters'),

  (req: express.Request, res: express.Response, next: express.NextFunction) => {
    if (areValidationErrors(req, res)) return
    return next()
  }
]

export const listApiFootballFixturesValidator = [
  query('teamId')
    .isInt({ min: 1 })
    .withMessage('Should have a valid team id'),

  query('next')
    .optional()
    .isInt({ min: 0, max: 50 })
    .withMessage('Should have a valid next limit'),

  query('last')
    .optional()
    .isInt({ min: 0, max: 50 })
    .withMessage('Should have a valid last limit'),

  query('season')
    .optional()
    .isInt({ min: 2000, max: 2100 })
    .withMessage('Should have a valid season'),

  query('from')
    .optional()
    .isISO8601({ strict: true })
    .withMessage('Should have a valid from date'),

  query('to')
    .optional()
    .isISO8601({ strict: true })
    .withMessage('Should have a valid to date'),

  (req: express.Request, res: express.Response, next: express.NextFunction) => {
    if (areValidationErrors(req, res)) return
    return next()
  }
]

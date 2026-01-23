import express from 'express'
import { body, param } from 'express-validator'
import { UserRight } from '@peertube/peertube-models'
import { areValidationErrors, checkCanManageVideo, doesVideoExist, isValidVideoIdParam } from '../shared/index.js'
import { isEventMarkerLabelValid, isEventMarkerTimecodeValid, isEventMarkerTypeValid } from '@server/helpers/custom-validators/video-event-markers.js'

export const createVideoEventMarkerValidator = [
  isValidVideoIdParam('videoId'),

  body('timecode')
    .custom(isEventMarkerTimecodeValid)
    .withMessage('Must have a valid timecode'),

  body('type')
    .custom(isEventMarkerTypeValid)
    .withMessage('Must have a valid event marker type'),

  body('label')
    .optional({ nullable: true })
    .custom(isEventMarkerLabelValid)
    .withMessage('Must have a valid label'),

  async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    if (areValidationErrors(req, res)) return
    if (!await doesVideoExist(req.params.videoId, res)) return

    const user = res.locals.oauth.token.User
    if (!await checkCanManageVideo({
      user,
      video: res.locals.videoAll,
      right: UserRight.UPDATE_ANY_VIDEO,
      req,
      res,
      checkIsLocal: true,
      checkIsOwner: false
    })) return

    return next()
  }
]

export const deleteVideoEventMarkerValidator = [
  isValidVideoIdParam('videoId'),

  param('markerId')
    .isInt({ min: 1 })
    .withMessage('Should have a valid marker id'),

  async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    if (areValidationErrors(req, res)) return
    if (!await doesVideoExist(req.params.videoId, res)) return

    const user = res.locals.oauth.token.User
    if (!await checkCanManageVideo({
      user,
      video: res.locals.videoAll,
      right: UserRight.UPDATE_ANY_VIDEO,
      req,
      res,
      checkIsLocal: true,
      checkIsOwner: false
    })) return

    return next()
  }
]

export const listVideoEventMarkersValidator = [
  isValidVideoIdParam('id'),

  async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    if (areValidationErrors(req, res)) return
    if (res.locals.onlyVideo) return next()
    if (!await doesVideoExist(req.params.id, res, 'only-video-and-blacklist')) return

    if (res.locals.onlyVideo.isLive === false) return next()

    // If video is live, allow listing markers publicly
    return next()
  }
]

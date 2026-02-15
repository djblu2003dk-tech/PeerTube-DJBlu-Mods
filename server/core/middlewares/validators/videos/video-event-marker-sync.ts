import express from 'express'
import { body } from 'express-validator'
import { UserRight } from '@peertube/peertube-models'
import { areValidationErrors, checkCanManageVideo, doesVideoExist, isValidVideoIdParam } from '../shared/index.js'
import {
  isEventMarkerSyncEnabledValid,
  isEventMarkerSyncFixtureIdValid,
  isEventMarkerSyncKickoffTimeValid,
  isEventMarkerSyncKickoffTimecodeValid,
  isEventMarkerSyncProviderValid
} from '@server/helpers/custom-validators/video-event-marker-sync.js'

export const getVideoEventMarkerSyncValidator = [
  isValidVideoIdParam('videoId'),

  async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    if (areValidationErrors(req, res)) return
    if (!await doesVideoExist(req.params.videoId, res)) return

    const user = res.locals.oauth?.token?.User
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

export const updateVideoEventMarkerSyncValidator = [
  isValidVideoIdParam('videoId'),

  body('enabled')
    .optional()
    .custom(isEventMarkerSyncEnabledValid)
    .withMessage('Must have a valid enabled flag'),

  body('provider')
    .optional()
    .custom(isEventMarkerSyncProviderValid)
    .withMessage('Must have a valid provider'),

  body('fixtureId')
    .optional({ nullable: true })
    .custom(isEventMarkerSyncFixtureIdValid)
    .withMessage('Must have a valid fixture id'),

  body('kickoffTime')
    .optional({ nullable: true })
    .custom(isEventMarkerSyncKickoffTimeValid)
    .withMessage('Must have a valid kickoff time (HH:mm)'),

  body('kickoffTimecode')
    .optional({ nullable: true })
    .custom(isEventMarkerSyncKickoffTimecodeValid)
    .withMessage('Must have a valid kickoff timecode'),

  async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    if (areValidationErrors(req, res)) return
    if (!await doesVideoExist(req.params.videoId, res)) return

    const user = res.locals.oauth?.token?.User
    if (!await checkCanManageVideo({
      user,
      video: res.locals.videoAll,
      right: UserRight.UPDATE_ANY_VIDEO,
      req,
      res,
      checkIsLocal: true,
      checkIsOwner: false
    })) return

    const { enabled, fixtureId, kickoffTimecode } = req.body || {}
    if (enabled === true && (!fixtureId || kickoffTimecode === undefined || kickoffTimecode === null)) {
      res.fail({ message: 'fixtureId and kickoffTimecode are required to enable sync' })
      return
    }

    return next()
  }
]

export const deleteVideoEventMarkerSyncValidator = [
  isValidVideoIdParam('videoId'),

  async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    if (areValidationErrors(req, res)) return
    if (!await doesVideoExist(req.params.videoId, res)) return

    const user = res.locals.oauth?.token?.User
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

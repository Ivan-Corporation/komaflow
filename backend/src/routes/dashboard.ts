import express from 'express'
import {
  getTokenOverview,
  getMintHistory,
  getBurnHistory,
  getTransferHistory,
  getBlacklistStatus,
  getSystemHealth
} from '../controllers/dashboardController'

const router = express.Router()

// Token overview and analytics
router.get('/token/overview', getTokenOverview)
router.get('/token/mints', getMintHistory)
router.get('/token/burns', getBurnHistory)
router.get('/token/transfers', getTransferHistory)
router.get('/token/blacklist', getBlacklistStatus)

// System information
router.get('/system/health', getSystemHealth)

export default router
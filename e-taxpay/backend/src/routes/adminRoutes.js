import express from 'express';
import {
  getAllUsers,
  getMetrics,
  getComplaints,
  updateComplaint,
  getNotices,
  createNotice,
  getAuditLogs,
  getGovUpdates,
  createGovUpdate,
  deleteGovUpdate
} from '../controllers/adminController.js';
import { requireAuth, requireAdmin } from '../middleware/authMiddleware.js';

const router = express.Router();

// All admin routes require authentication AND admin privileges
router.use(requireAuth, requireAdmin);

// Users
router.get('/users', getAllUsers);

// Dashboard metrics + analytics
router.get('/metrics', getMetrics);

// Complaints
router.get('/complaints', getComplaints);
router.patch('/complaints/:id', updateComplaint);

// Notices
router.get('/notices', getNotices);
router.post('/notices', createNotice);

// Audit logs
router.get('/audit-logs', getAuditLogs);

// Government updates
router.get('/gov-updates', getGovUpdates);
router.post('/gov-updates', createGovUpdate);
router.delete('/gov-updates/:id', deleteGovUpdate);

export default router;

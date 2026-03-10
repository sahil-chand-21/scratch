import express from 'express';
import { requireAuth } from '../middleware/authMiddleware.js';
import { getUserTaxes, fileUserTax, payUserTax } from '../controllers/taxesController.js';

const router = express.Router();

// All tax routes require authentication
router.use(requireAuth);

router.get('/', getUserTaxes);
router.post('/file', fileUserTax);
router.post('/:taxId/pay', payUserTax);

export default router;

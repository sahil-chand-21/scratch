import express from 'express';
import { loginUser, loginAdmin } from '../controllers/authController.js';

const router = express.Router();

// Public routes for logging in
router.post('/login/user', loginUser);
router.post('/login/admin', loginAdmin);

export default router;

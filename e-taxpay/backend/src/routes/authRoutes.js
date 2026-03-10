import express from 'express';
import { loginUser, loginAdmin, registerUser } from '../controllers/authController.js';

const router = express.Router();

router.post('/login/user', loginUser);
router.post('/login/admin', loginAdmin);
router.post('/register', registerUser);

export default router;

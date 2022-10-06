const express = require('express');
const { check, body } = require('express-validator');

const authController = require('../controllers/auth');

const router = express.Router();

router.get('/login', authController.getLogin);

router.post('/login', [
    check('email')
        .isEmail()
        .withMessage('Please enter your Email address.')
        .normalizeEmail(),
    body('password')
        .isLength({ min: 5 })
        .isAlphanumeric()
        .trim(),
], authController.postLogin);

router.post('/logout', authController.postLogout);

module.exports = router;
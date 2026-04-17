const express = require('express');
const router = express.Router();
const { login, getMe } = require('../controllers/authController');
const { getFields, getField, createField, updateField, deleteField, getStats, getNotes } = require('../controllers/fieldsController');
const { getAgents, createUser } = require('../controllers/usersController');
const { authenticate, requireAdmin } = require('../middleware/auth');

// Auth
router.post('/auth/login', login);
router.get('/auth/me', authenticate, getMe);

// Fields
router.get('/fields/stats', authenticate, getStats);
router.get('/fields/notes', authenticate, requireAdmin, getNotes);
router.get('/fields', authenticate, getFields);
router.get('/fields/:id', authenticate, getField);
router.post('/fields', authenticate, requireAdmin, createField);
router.put('/fields/:id', authenticate, updateField);
router.delete('/fields/:id', authenticate, requireAdmin, deleteField);

// Users (admin)
router.get('/users/agents', authenticate, requireAdmin, getAgents);
router.post('/users', authenticate, requireAdmin, createUser);

module.exports = router;
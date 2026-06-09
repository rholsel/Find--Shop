const router   = require('express').Router();
const ctrl     = require('../controllers/commerceController');
const { authenticate, requireRole, optionalAuth } = require('../middleware/auth');
const upload   = require('../middleware/upload');

// Lecture : accessible à tous (même non connectés)
router.get('/',    optionalAuth, ctrl.listCommerces);
router.get('/:id', optionalAuth, ctrl.getCommerce);

// Écriture : marchands uniquement
router.post('/',    authenticate, requireRole('merchant'), upload.single('image'), ctrl.createCommerce);
router.put('/:id',  authenticate, requireRole('merchant'), upload.single('image'), ctrl.updateCommerce);
router.delete('/:id', authenticate, requireRole('merchant'), ctrl.deleteCommerce);

module.exports = router;

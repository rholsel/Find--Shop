const router = require('express').Router();
const ctrl   = require('../controllers/productController');
const { authenticate, requireRole, optionalAuth } = require('../middleware/auth');
const upload = require('../middleware/upload');

// Lecture : accessible à tous
router.get('/',    optionalAuth, ctrl.listProducts);
router.get('/:id', optionalAuth, ctrl.getProduct);

// Écriture : marchands uniquement
router.post('/',    authenticate, requireRole('merchant'), upload.single('image'), ctrl.createProduct);
router.put('/:id',  authenticate, requireRole('merchant'), upload.single('image'), ctrl.updateProduct);
router.delete('/:id', authenticate, requireRole('merchant'), ctrl.deleteProduct);

module.exports = router;

const express = require('express');

const isAuthMiddleWare = require('../middleware/is-auth');
const managerController = require('../controllers/manager');

const router = express.Router();

router.get('/view-covid-info', isAuthMiddleWare.isLoggedIn, isAuthMiddleWare.isManager, managerController.saffList);

router.get('/view-covid-info/view/:viewId', isAuthMiddleWare.isLoggedIn, isAuthMiddleWare.isManager, managerController.getViewCovidInfo);

router.get('/confirm', isAuthMiddleWare.isLoggedIn, isAuthMiddleWare.isManager, managerController.saffList);

router.get('/confirm/view/:employeeViewId', isAuthMiddleWare.isLoggedIn, isAuthMiddleWare.isManager, managerController.getConfirm);

router.post('/confirm/delete-work-item', isAuthMiddleWare.isLoggedIn, isAuthMiddleWare.isManager, managerController.postDeleteWorkItem);

router.post('/confirm/confirmed', isAuthMiddleWare.isLoggedIn, isAuthMiddleWare.isManager, managerController.postConfirmed);

router.get('/view-covid-info/print/:printId', isAuthMiddleWare.isLoggedIn, isAuthMiddleWare.isManager, managerController.getFileCovidInfo);

module.exports = router;
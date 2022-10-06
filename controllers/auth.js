const User = require('../models/user');

const { validationResult } = require('express-validator');

exports.getLogin = (req, res, next) => {
    let message = req.flash('error');
    if (message.length > 0) {
        message = message[0];
    } else {
        message = null;
    }
    res.render('auth/login', {
        path: '/login',
        pageTitle: 'Đăng nhập',
        errorMessage: message,
        validationErrors: [],
        oldInput: {
            email: '',
            password: '',
        },
    });
};

exports.postLogin = (req, res, next) => {
    const email = req.body.email;
    const password = req.body.password;
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(422).render('auth/login', {
            path: '/login',
            pageTitle: 'Login',
            errorMessage: errors.array()[0].msg,
            validationErrors: errors.array(),
            oldInput: {
                email: email,
                password: password,
            },
        })
    }

    User.findOne({ email: email, password: password })
        .then(user => {
            if (!user) {
                return res.status(422).render('auth/login', {
                    path: '/login',
                    pageTitle: 'Login',
                    errorMessage: 'Invalid email or password.',
                    validationErrors: [],
                    oldInput: {
                        email: email,
                        password: password,
                    },
                });
            } else {
                req.session.user = user;
                req.session.isManager = user.isManager;
                req.session.isLoggedIn = true;
                if (!user.isManager) {
                    req.session.workingInfo = [];
                    req.session.timeWorks = [];

                }
                req.session.status = 0;
                return req.session.save((err) => {
                    res.redirect(req.session.redirectUrl || '/');
                })
            }
        })
        .catch(err => {
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
        });
};

exports.postLogout = (req, res, next) => {
    req.session.destroy(err => {
        res.redirect('/');
    });
};
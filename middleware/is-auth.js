
exports.isLoggedIn = (req, res, next) => {
    if (!req.session.isLoggedIn) {
        if (req.session) {
            req.session.redirectUrl = req.url;
            return res.redirect('/login')
        }
    } else {
        next();
    };
};

exports.isManager = (req, res, next) => {
    if (!req.session.isManager) {
        return res.redirect('/');
    }
    next();
};

exports.isStaff = (req, res, next) => {
    if (req.session.isManager) {
        return res.redirect('/');
    };
    next();
};
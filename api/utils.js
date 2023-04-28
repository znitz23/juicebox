const requireUser = (req, res, next) => {
    if(!req.user) {
        next({
            name: 'Not loggin in',
            message: 'You must be logged in to access this page'
        });
    }
    next();
}

module.exports = { requireUser }
app.post('/submit', (req, res) => {
    if (req.body.csrfToken !== req.session.csrf) {
        return res.status(403).send("CSRF Token Invalid");
    }

    res.send("Form submitted securely");
});

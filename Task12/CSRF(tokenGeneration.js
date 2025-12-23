// <!-- 3. Add CSRF explanation and a token mockup (demonstrate form token usage). -->
 // Node/Express mock server
app.get('/form', (req, res) => {
    const csrfToken = crypto.randomUUID();
    req.session.csrf = csrfToken;

    res.send(`
        <form method="POST" action="/submit">
            <input type="hidden" name="csrfToken" value="${csrfToken}">
            <input type="text" name="comment">
            <button type="submit">Submit</button>
        </form>
    `);
});

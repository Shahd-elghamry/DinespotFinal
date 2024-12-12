const { verifyToken } = require("./userRoutes");

var ContactRoutes = function (app, db) {

    app.get('/restaurants/search', (req, res) => {
        const searchQuery = req.query.q;  // Query parameter for restaurant name or ID

        if (!searchQuery) {
            return res.status(400).send('Search query is required');
        }

        // Query the restaurant table to find matching names or IDs
        const query = `SELECT id, name FROM restaurant WHERE name LIKE ? OR id LIKE ? LIMIT 10`;
        db.all(query, [`%${searchQuery}%`, `%${searchQuery}%`], (err, rows) => {
            if (err) {
                console.log(err);
                return res.status(500).send(err);
            }

            return res.json(rows);  // Send the matching restaurants
        });
    });

    app.post('/contact', (req, res) => {
        const email = req.user?.email || req.body.email;
        const question = req.body.question;

        console.log('Request email:', email);
        console.log('Request question:', question);
        
        if (!email || !question) {
            return res.status(400).send({ error: 'Email and question are required.' });
        }    

        const query = `INSERT INTO contact (email, question) VALUES (?, ?)`;
    db.run(query, [email, question], (err) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).send({ error: 'Database error occurred.' });
        }

        return res.status(200).send({ message: 'Sent Successfully' });
    });
});
    
    

app.get('/contact',verifyToken, (req, res) => {

    if (req.user.user_type !== 'admin') {
        return res.status(403).send('Access denied: You are not authorized to view contacts');
    }

    const query = 'SELECT * FROM contact'
    db.all(query, [], (err, rows) => {
        if (err) {
            console.log(err)
            return res.status(500).send(err)
        }
        else {
            return res.json(rows)
        }
    })
})


    return app;
}

module.exports = { ContactRoutes }
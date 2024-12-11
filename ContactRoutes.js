const { verifyToken } = require("./userRoutes");

var ContactRoutes = function (app, db) {

    app.post('/contact',verifyToken, (req, res) => {
        let question = req.body.question
        let type = req.body.type
        let userid = req.user.id
        let email = req.user.email

        if (!question || !email || !type) {
            return res.status(400).send('Missing required fields: question or email');
        }
        
        const query = `INSERT INTO contact (user_id, email, question,type) VALUES (?, ?, ?,?)`;
        db.run(query, [userid, email, question,type], function (err) {
            if (err) {
                console.log(err)
                return res.json(err)
            }
            else
                return res.send("Sent Successfully")
        })
    })
    
    

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
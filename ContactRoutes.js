var ContactRoutes = function (app, db) {

    app.post('/contact', (req, res) => {
        let question = req.body.question
        let userid = parseInt(req.body.userid, 10)
        let email = req.body.email
        query = `INSERT INTO contact (user_id, email, question) VALUES (${userid}, '${email}', '${question}')`
        db.run(query, (err) => {
            if (err) {
                console.log(err)
                return res.json(err)
            }
            else
                return res.send("Sent Successfully")
        })
    })
    
    

app.get('/contact', (req, res) => {
    const query = 'SELECT * FROM contact'
    db.all(query, (err, rows) => {
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
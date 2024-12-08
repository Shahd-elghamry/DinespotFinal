var UserR = function(app, db){
    app.post('/users/register', (req, res) => {
        let username = req.body.username
        let email = req.body.email
        let password = req.body.password
        let user_type = req.body.user_type
        let phonenum = req.body.phonenum
    
        if (!username || !email || !password || !phonenum) {
            return res.status(400).send('All fields are required');
        }
    
        const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[com]{3}$/;
    
        if (!emailRegex.test(email)) {
            return res.status(400).send('Invalid email format. The email should contain "@*.com".');
        }
        db.run(`INSERT INTO USER(username,email,password,phonenum,user_type)Values('${username}','${email}','${password}','${phonenum}','${user_type}')`, (err) => {
            if (err) {
                console.log(err.message)
                return res.status(401).send(err)
            }
            else
                return res.status(200).send('registeration successful')
        })
    });

    app.post('/user/login', (req, res) => {
        let email = req.body.email
        let password = req.body.password
        db.get(`SELECT * FROM USER WHERE EMAIL = '${email}' AND PASSWORD= '${password}'`, (err, row) => {
            if (err || !row)
                return res.status(401).send("invalid credentials")
            else
                return res.status(200).send('login successfull')
        })

    });
    app.get('/users', (req, res) => {
        const query = 'SELECT * FROM USER'
        db.all(query, (err, rows) => {
            if (err) {
                console.log(err)
                return res.send(err)
            }
            else {
                return res.json(rows)
            }
        })
    }); 

    app.put('/user/edit/:id', (req, res) => {
        let username = req.body.username;
        let email = req.body.email;
        let password = req.body.password;
        let phonenum = parseInt(req.body.phonenum, 10)
        let updates = []
    
        if (username) updates.push(`username = '${username}'`);
        if (email) updates.push(`email = '${email}'`);
        if (password) updates.push(`password = '${password}'`);
        if (phonenum) updates.push(`phonenum = '${phonenum}'`);
    
        if (updates.length === 0) {
            return res.status(400).send('No fields to update. Provide at least one field.');
        }
    
        const query = `UPDATE user SET ${updates.join(', ')} WHERE ID = ${req.params.id}`;
    
        db.run(query, function (err) {
            if (err) {
                console.log(err);
                return res.status(500).send('An error occurred while updating the user.');
            }
    
            if (this.changes === 0) {
                return res.status(404).send('No user found with the provided ID.');
            }
    
            return res.send(`User with ID ${req.params.id} updated successfully.`);
        });
    });
    
    return app;
}

module.exports = {UserR}
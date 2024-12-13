const token = require('jsonwebtoken')
const secret_key = 'asdfghjklertyuiodfghjdbh8u'
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken');


const generatetoken = (id, user_type, email, username) => {
    return token.sign({ id, user_type, email, username }, secret_key, { expiresIn: '5h' })
}



var UserRoutes = function (app, db) {
    app.post('/users/register', (req, res) => {
        let username = req.body.username
        let email = req.body.email
        let password = req.body.password
        let user_type = req.body.user_type
        let phonenum = req.body.phonenum

        if (!username || !email || !password || !phonenum) {
            return res.status(400).send('All fields are required');
        }

        const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;


        if (!emailRegex.test(email)) {
            return res.status(400).send('Invalid email format. The email should contain "@*.com".');
        }

        bcrypt.hash(password, 10, (hashErr, hashedPassword) => {
            if (hashErr) {
                console.error(hashErr);
                return res.status(500).send('An error occurred while securing the password');
            }

            query = `INSERT INTO USER(username, email, password, phonenum, user_type) VALUES (?, ?, ?, ?, ?)`
            db.run(query, [username, email, hashedPassword, phonenum, user_type], function(err) {
                if (err) {
                    console.log('Database error:', err.message);
                    if (err.code === 'SQLITE_CONSTRAINT') {
                        if (err.message.includes('UNIQUE')) {
                            return res.status(409).json({
                                error: 'Email already exists',
                                message: 'An account with this email address already exists. Please use a different email or try logging in.'
                            });
                        }
                    }
                    return res.status(500).json({
                        error: 'Registration failed',
                        message: 'An error occurred during registration. Please try again.'
                    });
                }
                const token = generatetoken(this.lastID, user_type, email, username);
                
                res.cookie('auth', token, {
                    httpOnly: true,
                    sameSite: 'strict',
                    maxAge: 5 * 60 * 60 * 1000, // 5 hours
                });
                return res.status(200).json({
                    message: 'Registration successful',
                    token,
                    userId: this.lastID,
                    userType: user_type,
                    email: email,
                    username: username
                });
            })
        })

    });

    app.post('/user/login', (req, res) => {
        let email = req.body.email;
        let password = req.body.password;

        // Get user by email from the database
        db.get(`SELECT * FROM USER WHERE EMAIL = ?`, [email], (err, row) => {
            if (err || !row) {
                return res.status(401).json({ message: "Invalid credentials" });
            }

            // Compare the hashed password with the plain password
            bcrypt.compare(password, row.password, (err, isMatch) => {
                if (err) {
                    return res.status(500).json({ message: "Error comparing passwords" });
                }
                if (!isMatch) {
                    return res.status(401).json({ message: "Invalid credentials" });
                }

                const token = generatetoken(row.id, row.user_type, row.email, row.username);

                // Set the token as a cookie
                res.cookie('auth', token, {
                    httpOnly: true,
                    sameSite: 'strict',
                    maxAge: 5 * 60 * 60 * 1000
                });

                return res.status(200).json({
                    message: 'Login successful',
                    token,
                    username: row.username,
                    userType: row.user_type,
                    email: row.email
                });
            });
        });
    });

    app.get('/users', verifyToken, (req, res) => {
        if (req.info.user_type !== 'admin') {
            return res.status(403).send("You are not an admin")
        }
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

    app.put('/user/edit/:id', verifyToken, (req, res) => {
        const userId = req.user.id;

        let username = req.body.username;
        let email = req.body.email;
        let password = req.body.password;
        let phonenum = parseInt(req.body.phonenum, 10)
        
        let updates = []
        let params = []

        if (username) {
            updates.push(`username = ?`);
            params.push(username);
        }
        if (email) {
            db.get('SELECT * FROM USER WHERE email = ?', [email], (err, existingUser) => {
                if (existingUser) {
                    return res.status(400).send('Email address already exists. Please choose a different one.');
                }
    
                updates.push(`email = ?`);
                params.push(email);
            });
        }
        if (password) {
            const hashedPassword = bcrypt.hashSync(password, 10);
            updates.push(`password = ?`);
            params.push(hashedPassword);
        }
        if (phonenum) {
            updates.push(`phonenum = ?`);
            params.push(phonenum);
        }

        if (updates.length === 0) {
            return res.status(400).send('No fields to update. Provide at least one field.');
        }

        params.push(userId);
                                                                                                                                                   
        const query = `UPDATE user SET ${updates.join(', ')} WHERE id = ?`;

        db.run(query, params, function (err) {
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

    app.delete('/user/:id', verifyToken, (req, res) => {
        const userIdToDelete = req.user.id;

        if (isNaN(userIdToDelete)) {
            return res.status(400).send("Invalid user ID");
        }
        const query = `DELETE FROM USER WHERE id = ?`;

        db.run(query, [userIdToDelete], function (err) {
            if (err) {
                console.log(err);
                return res.status(500).send("Error deleting user");
            }
            if (this.changes === 0) {
                return res.status(404).send("No user found with the provided ID");
            }
            return res.status(200).send(`User with id ${userIdToDelete} deleted successfully`);
        });
    });

    app.post('/user/forgot-password', (req, res) => {
        let email = req.body.email;
    
        const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[com]{3}$/;
        if (!email || !emailRegex.test(email)) {
            return res.status(400).send('Invalid email format. Please enter a valid email address.');
        }
    
        db.get('SELECT * FROM USER WHERE EMAIL = ?', [email], (err, row) => {
            if (err) {
                return res.status(500).send('An error occurred while checking the email.');
            }
    
            if (!row) {
                return res.status(404).send('This email is not registered.');
            }
    
            return res.status(200).send('An email with a link to reset password will be sent to this email');
        });
    });
    

    return app;
}
const verifyToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    const cookieToken = req.cookies.auth;

    if (!token && !cookieToken ) {
        return res.status(403).send('Access denied: No token provided');
    }

    const verifiedToken = token || cookieToken;

    jwt.verify(verifiedToken, secret_key, (err, decoded) => {
        if (err) {
            return res.status(500).send({ message: 'Invalid Token' });
        }
        req.user = decoded; 
        console.log("Decoded Token in Middleware:", req.user);
        next();
    });
};

module.exports = { UserRoutes, verifyToken }
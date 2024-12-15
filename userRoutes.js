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
            return res.status(400).json({ message: 'All fields are required' });
        }

        const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;


        if (!emailRegex.test(email)) {
            return res.status(400).json({ message: 'Invalid email format. The email should contain "@*.com".' });
        }

        bcrypt.hash(password, 10, (hashErr, hashedPassword) => {
            if (hashErr) {
                console.error(hashErr);
                return res.status(500).json({ message: 'An error occurred while securing the password' });
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
                    userId: row.id,
                    userType: row.user_type,
                    email: row.email,
                    username: row.username,
                    phonenum: row.phonenum
                });
            });
        });
    });

    app.get('/users', verifyToken, (req, res) => {
        if (req.info.user_type !== 'admin') {
            return res.status(403).json({ message: "You are not an admin" });
        }
        const query = 'SELECT * FROM USER'
        db.all(query, (err, rows) => {
            if (err) {
                console.log(err)
                return res.json({ message: 'Error fetching users' });
            }
            else {
                return res.json(rows)
            }
        })
    });

    app.get('/user/:id', verifyToken, (req, res) => {
        const userId = parseInt(req.params.id, 10);
        
        // Check if user is requesting their own info or is an admin
        if (req.user.id !== userId && req.user.user_type !== 'admin') {
            return res.status(403).json({ message: 'Access denied. You can only view your own profile.' });
        }

        const query = `
            SELECT id, username, email, phonenum, user_type 
            FROM user 
            WHERE id = ?`;
            
        db.get(query, [userId], (err, row) => {
            if (err) {
                console.error(err);
                return res.status(500).json({ message: 'Error retrieving user information' });
            }
            if (!row) {
                return res.status(404).json({ message: 'User not found' });
            }
            // Don't send sensitive information like password
            return res.json(row);
        });
    });

    app.put('/user/edit/:id', verifyToken, async (req, res) => {
        const userId = req.user.id;

        let username = req.body.username;
        let email = req.body.email;
        let password = req.body.password;
        let phonenum = parseInt(req.body.phonenum, 10);
        
        let updates = [];
        let params = [];

        if (username) {
            updates.push(`username = ?`);
            params.push(username);
        }
        
        if (email) {
            try {
                // Check if email exists (for another user)
                const existingUser = await new Promise((resolve, reject) => {
                    db.get('SELECT * FROM USER WHERE email = ? AND id != ?', [email, userId], (err, row) => {
                        if (err) reject(err);
                        resolve(row);
                    });
                });

                if (existingUser) {
                    return res.status(400).json({ message: 'Email address already exists. Please choose a different one.' });
                }

                updates.push(`email = ?`);
                params.push(email);
            } catch (err) {
                console.error(err);
                return res.status(500).json({ message: 'Error checking email availability' });
            }
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
            return res.status(400).json({ message: 'No fields to update. Provide at least one field.' });
        }

        params.push(userId);
        const query = `UPDATE user SET ${updates.join(', ')} WHERE id = ?`;

        db.run(query, params, function (err) {
            if (err) {
                console.log(err);
                return res.status(500).json({ message: 'An error occurred while updating the user.' });
            }

            if (this.changes === 0) {
                return res.status(404).json({ message: 'No user found with the provided ID.' });
            }

            res.json({ message: `User with ID ${userId} updated successfully.` });
        });
    });

    app.delete('/user/:id', verifyToken, (req, res) => {
        const userIdToDelete = req.user.id;

        if (isNaN(userIdToDelete)) {
            return res.status(400).json({ message: "Invalid user ID" });
        }
        const query = `DELETE FROM USER WHERE id = ?`;

        db.run(query, [userIdToDelete], function (err) {
            if (err) {
                console.log(err);
                return res.status(500).json({ message: "Error deleting user" });
            }
            if (this.changes === 0) {
                return res.status(404).json({ message: "No user found with the provided ID" });
            }
            return res.status(200).json({ message: `User with id ${userIdToDelete} deleted successfully` });
        });
    });

    app.post('/user/forgot-password', (req, res) => {
        let email = req.body.email;
    
        const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[com]{3}$/;
        if (!email || !emailRegex.test(email)) {
            return res.status(400).json({ message: 'Invalid email format. Please enter a valid email address.' });
        }
    
        db.get('SELECT * FROM USER WHERE EMAIL = ?', [email], (err, row) => {
            if (err) {
                return res.status(500).json({ message: 'An error occurred while checking the email.' });
            }
    
            if (!row) {
                return res.status(404).json({ message: 'This email is not registered.' });
            }
    
            return res.status(200).json({ message: 'An email with a link to reset password will be sent to this email' });
        });
    });
    

    // Get user profile endpoint
    app.get('/user/profile', verifyToken, (req, res) => {
        const userId = req.user.id;
        console.log("Fetching profile for user:", userId);
        
        if (!userId) {
            return res.status(400).json({ message: "User ID not found in token" });
        }
        
        db.get(
            `SELECT id, username, email, user_type, phonenum, created_at, 
            (SELECT COUNT(*) FROM RESTAURANT WHERE owner_id = USER.id) as restaurantsCount 
            FROM USER WHERE id = ?`,
            [userId],
            (err, user) => {
                if (err) {
                    console.error("Database error:", err);
                    return res.status(500).json({ message: "Error fetching user profile" });
                }
                if (!user) {
                    return res.status(404).json({ message: "User not found" });
                }

                // Format the response
                const userProfile = {
                    id: user.id,
                    name: user.username,
                    email: user.email,
                    userType: user.user_type,
                    phone: user.phonenum,
                    createdAt: user.created_at,
                    lastLogin: new Date().toISOString(),
                    restaurantsCount: user.restaurantsCount
                };

                console.log("Sending user profile:", userProfile);
                res.json(userProfile);
            }
        );
    });

    return app;
}

const verifyToken = (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];
        const cookieToken = req.cookies ? req.cookies.auth : null;

        if (!token && !cookieToken) {
            return res.status(403).json({ message: 'Access denied: No token provided' });
        }

        const verifiedToken = token || cookieToken;

        jwt.verify(verifiedToken, secret_key, (err, decoded) => {
            if (err) {
                console.error("Token verification error:", err);
                return res.status(401).json({ message: 'Invalid Token' });
            }
            
            // Add more user information to the request
            req.user = {
                id: decoded.id,
                email: decoded.email,
                username: decoded.username,
                user_type: decoded.user_type
            };
            
            console.log("Decoded Token in Middleware:", req.user);
            next();
        });
    } catch (error) {
        console.error("Error in verifyToken middleware:", error);
        return res.status(500).json({ message: 'Server error in token verification' });
    }
};

module.exports = { UserRoutes, verifyToken }
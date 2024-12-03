const express = require('express');
const app = express();
const port = 5005;
app.use(express.json());
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('dinespot.db');


//Just to verify the website works

app.get('/', (req, res) => { // Beysha8al el website 
    res.send("Hello World!"); // awel ma afta7 byeegy hello world == http://127.0.0.1:5005
})

const createUserTable = `
    CREATE TABLE IF NOT EXISTS user (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL,
        phonenum TEXT NOT NULL,
        user_type TEXT NOT NULL
    )`;
// created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP

const createResturantTable = `
    CREATE TABLE IF NOT EXISTS resturant (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        location TEXT NOT NULL ,
        cuisine TEXT NOT NULL,
        halal TEXT,
        min_of_health TEXT,
        maxcapacity INT NOT NULL,
        dietary TEXT ,
        availabecapacity INT NOT NULL 
    )`;
// created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP

const createBookingTable = `
    CREATE TABLE IF NOT EXISTS booking (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        restaurant_id INTEGER NOT NULL,
        booking_date TEXT NOT NULL,
        booking_time TEXT NOT NULL,
        quantity INTEGER NOT NULL,
        FOREIGN KEY (user_id) REFERENCES user(id),
        FOREIGN KEY (restaurant_id) REFERENCES restaurant(id)
    )`;
//        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

const createReviewTable = `
CREATE TABLE IF NOT EXISTS review (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,            
    restaurant_id INTEGER NOT NULL,      
    rating INTEGER NOT NULL,     
    review TEXT,                          
    FOREIGN KEY (user_id) REFERENCES user(id),
    FOREIGN KEY (restaurant_id) REFERENCES restaurant(id)
    )`;
// created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

const createContactTable = `
CREATE TABLE IF NOT EXISTS contact (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,            
    email TEXT NOT NULL,
    question TEXT NOT NULL,                          
    FOREIGN KEY (user_id) REFERENCES user(id),
    FOREIGN KEY (email) REFERENCES user(email)
    )`;



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


app.post('/addresturant', (req, res) => {
    let name = req.body.name
    let location = req.body.location
    let cuisine = req.body.cuisine
    let maxcapacity = parseInt(req.body.maxcapacity, 10)
    let halal = req.body.halal
    let min_of_health = req.body.min_of_health
    let dietary = req.body.dietary

    const missingFields = [];
    if (!name) missingFields.push('name');
    if (!location) missingFields.push('location');
    if (!cuisine) missingFields.push('cuisine');

    if (missingFields.length > 0) {
        return res.status(400).send(`Missing required fields: ${missingFields.join(', ')}`);
    }

    db.run(`INSERT INTO RESTURANT (name, location, cuisine, maxcapacity, availabecapacity, halal, min_of_health, dietary) Values ('${name}', '${location}','${cuisine}',${maxcapacity},${maxcapacity},'${halal}','${min_of_health}','${dietary}')`, (err) => {
        if (err)
            return res.status(401).send(err)
        else
            return res.status(200).send('Added successfully')
    })
})


app.get('/resturant', (req, res) => {
    const query = 'SELECT * FROM RESTURANT'
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

app.get('/resturant/search/:location?/:cuisine?/:dietary?/:halal?', (req, res) => {
    let { location, cuisine, dietary, halal } = req.params;
    let query = `SELECT * FROM resturant WHERE 1=1`;
    let params = []

    if (location) {
        location = location.trim();
        query += ` AND LOWER(location) LIKE LOWER(?)`;
        params.push(`%${location}%`);
    }
    if (cuisine) {
        cuisine = cuisine.trim();
        query += ` AND LOWER(cuisine) LIKE LOWER(?)`;
        params.push(`%${cuisine}%`);
    }
    if (dietary) {
        dietary = dietary.trim();
        query += ` AND LOWER(dietary) LIKE LOWER(?)`;
        params.push(`%${dietary}%`);
    }
    if (halal) {
        halal = halal.trim();
        query += ` AND LOWER(halal) LIKE LOWER(?)`;
        params.push(`%${halal}%`);
    }

    console.log(query, params);

    db.all(query, params, (err, rows) => {
        if (err) {
            console.log(err);
            return res.status(500).send(err.message);
        }
        if (rows.length === 0) {
            return res.status(404).send('No restaurants found matching the criteria.');
        }
        return res.json(rows);
    });
});

app.post('/users/register', (req, res) => {
    let username = req.body.username
    let email = req.body.email
    let password = req.body.password
    let user_type = req.body.user_type
    let phonenum = req.body.phonenum

    if (!username || !email || !password || !phonenum) {
        return res.status(400).send('All fields are required');
    }

    db.run(`INSERT INTO USER(username,email,password,phonenum,user_type)Values('${username}','${email}','${password}','${phonenum}','${user_type}')`, (err) => {
        if (err) {
            console.log(err.message)
            return res.status(401).send(err)
        }
        else
            return res.status(200).send('registeration successful')
    })
})


// for loggin in 
app.post('/user/login', (req, res) => {
    let email = req.body.email
    let password = req.body.password
    db.get(`SELECT * FROM USER WHERE EMAIL = '${email}' AND PASSWORD= '${password}'`, (err, row) => {
        if (err || !row)
            return res.status(401).send("invalid credentials")
        else
            return res.status(200).send('login successfull')
    })
})

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
})


app.put('/resturant/edit/:id', (req, res) => {
    const resID = parseInt(req.params.id, 10);

    let name = req.body.name
    let location = req.body.location
    let cuisine = req.body.cuisine
    let maxcapacity = parseInt(req.body.maxcapacity, 10)
    let halal = req.body.halal
    let min_of_health = req.body.min_of_health
    let dietary = req.body.dietary

    let updates = []
    if (name) updates.push(`name = '${name}'`);
    if (location) updates.push(`location = '${location}'`);
    if (cuisine) updates.push(`cuisine = '${cuisine}'`);
    if (maxcapacity) updates.push(`maxcapacity = ${maxcapacity}`);
    if (halal) updates.push(`halal = '${halal}'`);
    if (min_of_health) updates.push(`min_of_health = '${min_of_health}'`);
    if (dietary) updates.push(`dietary = '${dietary}'`);

    if (updates.length === 0) {
        return res.status(400).send('No fields to update. Provide at least one field.');
    }

    const query = `UPDATE resturant SET ${updates.join(', ')} WHERE ID = ${resID}`;

    db.run(query, function (err) {
        if (err) {
            console.log(err);
            return res.status(500).send('An error occurred while updating the restaurant.');
        }

        if (this.changes === 0) {
            return res.status(404).send('There is no restaurant with that ID.');
        }

        return res.send('Restaurant edited successfully.');
    });
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


//WHERE QUANTITY>0 // momken yeb2a added after from resturant 
app.get('/resturant/search', (req, res) => {
    let location = req.query.location
    let cuisine = req.query.cuisine
    let query = `SELECT * FROM RESTURANT `
    if (location) {
        query += ` WHERE LOCATION='${location}'`;
    }
    if (cuisine) {
        if (location) {
            query += ` AND CUISINE='${cuisine}'`;
        } else {
            query += ` WHERE CUISINE='${cuisine}'`;
        }
    }

    db.all(query, (err, rows) => {
        if (err) {
            console.log(err)
            return res.send(err)
        }
        else {
            return res.json(rows)
        }
    })
})

app.put('/resturant/book', (req, res) => {
    let name = req.query.name
    let date = req.query.date
    let time = req.query.time
    let quantity = parseInt(req.query.quantity, 10)
    let query = `SELECT availabecapacity,id FROM resturant WHERE name = '${name}'`;
    db.get(query, (err, row) => {
        if (err) {
            console.log(err)
            return res.json(err)
        }
        else {
            let current = parseInt(row.availabecapacity, 10)
            if (quanity > current)
                return res.send("No available seats")
            else {
                let resID = parseInt(row.id, 10)
                let available = current - quantitiy
                query = `UPDATE resturant SET availablecapacity = ${available} WHERE id = ${resID}`
                db.run(query, (err) => {
                    if (err) {
                        console.log(err)
                        return res.json(err)
                    }
                    else {
                        let userid = parseInt(req.body.userid, 10)
                        query = `INSERT INTO booking ( 
                            user_id, 
                            restaurant_id,
                            booking_date,
                            booking_time,
                            quantity) VALUES (${userid}, ${resID}, '${date}', '${time}')`
                        db.run(query, (err) => {
                            if (err) {
                                console.log(err)
                                return res.json(err)
                            }
                            else
                                return res.send("Booking done successfully")
                        })
                    }
                })
            }
        }
    })

})

app.delete('/resturant/:id', (req, res) => {
    const query = `DELETE FROM RESTURANT WHERE id=${req.params.id}`;

    db.run(query, (err) => {
        if (err) {
            console.log(err);
            return res.status(500).send("Error deleting restaurant");
        }
        else
            return res.status(200).send(`Restaurant with id ${req.params.id} deleted successfully`);
    });
});

app.delete('/user/:id', (req, res) => {
    const query = `DELETE FROM USER WHERE id=${req.params.id}`;

    db.run(query, (err) => {
        if (err) {
            console.log(err);
            return res.status(500).send("Error deleting user");
        }
        return res.status(200).send(`User with id ${req.params.id} deleted successfully`);
    });
});


app.listen(port, () => {       // listening on port 5005
    console.log(`Server started on port ${port}`)
    db.serialize(() => { // Executes in a synchronously order 
        db.exec(createUserTable, (err) => {
            if (err) {
                console.error("Error creating user table:", err);
            } else {
                console.log("User table created successfully!");
            }
        });
        db.exec(createResturantTable, (err) => {
            if (err) {
                console.error("Error creating Resturant table:", err);
            } else {
                console.log("Resturant table created successfully!");
            }
        });
        db.exec(createBookingTable, (err) => {
            if (err) {
                console.error("Error creating Booking table:", err);
            } else {
                console.log("Booking table created successfully!");
            }
        });
        db.exec(createReviewTable, (err) => {
            if (err) {
                console.error("Error creating Review table:", err);
            } else {
                console.log("Review table created successfully!");
            }
        });
        db.exec(createContactTable, (err) => {
            if (err) {
                console.error("Error creating Contact table:", err);
            } else {
                console.log("Contact table created successfully!");
            }
        });
    });
    setInterval(() => {
        console.log(`Server is running on port: ${port}`);
    }, 7000)
});



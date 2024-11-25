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
        user_type TEXT NOT NULL
    )`;
// created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP

const createResturantTable = `
    CREATE TABLE IF NOT EXISTS resturant (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        location TEXT NOT NULL ,
        cuisine TEXT NOT NULL,
        maxcapacity INT NOT NULL,
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

const createcContactTable = `
CREATE TABLE IF NOT EXISTS contact (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,            
    email TEXT NOT NULL,
    question TEXT NOT NULL,                          
    FOREIGN KEY (user_id) REFERENCES user(id),
    FOREIGN KEY (email) REFERENCES user(email)
    )`;



app.post('/contact', (req,res)=> {
    let question = req.body.question
    let userid = parseInt(req.body.userid, 10)
    let email = req.body.email
    query = `INSERT INTO contact (user_id,email,question) VALUES (${userid}, '${email}'s, '${question}')`
    db.run(query, (err) => {
        if (err) {
            console.log(err)
            return res.json(err)
        }
        else
            return res.send("Sent Successfully")
})
})

app.get('/contact',(req,res)=>{
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

    if (!name || !location || !cuisine || !maxcapacity) {
        return res.status(400).send('All fields are required');
    }

    db.run(`INSERT INTO RESTURANT (name, location, cuisine, maxcapacity, availabecapacity) Values ('${name}', '${location}','${cuisine}',${maxcapacity},${maxcapacity})`, (err) => {
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

app.get('/resturant/:location', (req, res) => {
    const query = `SELECT * FROM resturant WHERE location='${req.params.location}'`
    db.all(query, (err, row) => {
        if (err) {
            console.log(err)
            return res.send(err)
        }
        else if (!row) {
            return res.send(`Resturant with location ${req.params.location} was not found`)
        }
        else {
            return res.send(row)
        }
    })
})

app.post('/users/register', (req, res) => {
    let username = req.body.username
    let email = req.body.email
    let password = req.body.password
    let user_type = req.body.user_type
    db.run(`INSERT INTO USER(username,email,password,user_type)Values('${username}','${email}','${password}','${user_type}')`, (err) => {
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


app.put('/resturant/edit/:id/:location', (req, res) => {
    const query = `UPDATE resturant SET location= '${req.params.location}'
    WHERE ID=${req.params.id}`
    db.run(query, (err) => {
        if (err) {
            console.log(err)
            return res.send(err)
        }
        else {
            return res.send('Resturant edited successfully')
        }
    })
})

app.put('/user/edit/:id/:password', (req, res) => {
    const query = `UPDATE user SET password= '${req.params.location}'
    WHERE ID=${req.params.id}`
    db.run(query, (err) => {
        if (err) {
            console.log(err)
            return res.send(err)
        }
        else {
            return res.send(`User with ${req.params.id} edited successfully`)
        }
    })
})

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
    let quantitiy = parseINT(req.query.quantitiy, 10)
    let query = `SELECT availablecapacity,id FROM resturant WHERE name = '${name}'`;
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
    });
    setInterval(() => {
        console.log(`Server is running on port: ${port}`);
    }, 2500)
});



const express = require('express');
var app = express();
const port = 5005;
app.use(express.json());
const db_access = require('./database');
const user_Routes = require('./userRoutes');
const resturant_routes = require('./ResturantRoutes');
const review_routes = require('./ReviewRoutes')
const db = db_access.db;

//Just to verify the website works

app.get('/', (req, res) => { // Beysha8al el website 
    res.send("Hello World!"); // awel ma afta7 byeegy hello world == http://127.0.0.1:5005
})
app = user_Routes.UserRoutes(app, db);
app = resturant_routes.RestaurantRoutes(app,db);
app = review_routes.ReviewRoutes(app,db);


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





//WHERE QUANTITY>0 // momken yeb2a added after from resturant 
// app.get('/resturant/search', (req, res) => {
//     let location = req.query.location
//     let cuisine = req.query.cuisine
//     let query = `SELECT * FROM RESTURANT `
//     if (location) {
//         query += ` WHERE LOCATION='${location}'`;
//     }
//     if (cuisine) {
//         if (location) {
//             query += ` AND CUISINE='${cuisine}'`;
//         } else {
//             query += ` WHERE CUISINE='${cuisine}'`;
//         }
//     }

//     db.all(query, (err, rows) => {
//         if (err) {
//             console.log(err)
//             return res.send(err)
//         }
//         else {
//             return res.json(rows)
//         }
//     })
// })

app.put('/resturant/book', (req, res) => {
    const userId = parseInt(req.body.userid, 10);
    let name = req.body.name
    let date = req.body.date
    let time = req.body.time
    let quantity = parseInt(req.body.quantity, 10)

    if (!name || !date || !time || isNaN(quantity) || isNaN(userId)) {
        return res.status(400).send('Invalid input. Please provide all required fields.');
    }

    let query = `SELECT availablecapacity, id FROM resturant WHERE LOWER(name) = LOWER(?)`;
    db.get(query,[name],(err, row) => {
        if (err) {
            console.log(err)
            return res.json(err)
        } else if (!row){
            return res.status(404).send('Restaurant not found.');
        }
        else {
            let current = parseInt(row.availablecapacity, 10)
            if (quantity > current)
                return res.send("No available seats")
            else {
                let resID = parseInt(row.id, 10)
                let available = current - quantity
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
                            quantity) VALUES (${userid}, ${resID}, '${date}', '${time}',${quantity})`
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




app.get('/bookings', (req, res) => {
    const query = 'SELECT * FROM booking';

    db.all(query, (err, rows) => {
        if (err) {
            console.log(err);
            return res.status(500).send("Error fetching bookings");
        }
        return res.json(rows); 
    });
});

app.get('/booking/:userId', (req, res) => {
    const userID = req.params.userId;

    const query = `SELECT * FROM booking WHERE id = ${userID}`;

    db.get(query, (err, row) => {
        if (err) {
            console.log(err);
            return res.status(500).send("Error fetching booking");
        }

        if (!row) {
            return res.status(404).send(`No booking found with ID ${userID}`);
        }

        return res.json(row);  // Return the booking data if found
    });
});

app.put('/booking/:bookingId', (req, res) => {
    const bookingId = req.params.bookingId;
    const { user_id, restaurant_id, booking_date, booking_time, quantity } = req.body;

    const updates = [];

    if (user_id) updates.push(`user_id = ${user_id}`);
    if (restaurant_id) updates.push(`restaurant_id = ${restaurant_id}`);
    if (booking_date) updates.push(`booking_date = '${booking_date}'`);
    if (booking_time) updates.push(`booking_time = '${booking_time}'`);
    if (quantity) updates.push(`quantity = ${quantity}`);

    if (updates.length === 0) {
        return res.status(400).send('No fields to update. Please provide at least one field.');
    }

    const checkQuery = `SELECT * FROM booking WHERE id = ${bookingId}`;

    db.get(checkQuery, (err, row) => {
        if (err) {
            console.log(err);
            return res.status(500).send('Error checking booking existence');
        }

        if (!row) {
            return res.status(404).send(`No booking found with id ${bookingId}`);
        }

        const updateQuery = `UPDATE booking SET ${updates.join(', ')} WHERE id = ${bookingId}`;

        db.run(updateQuery, (err) => {
            if (err) {
                console.log(err);
                return res.status(500).send('Error updating booking');
            }
            return res.status(200).send(`Booking with id ${bookingId} updated successfully`);
        });
    });
});



app.delete('/booking/:id', (req, res) => {
    const query = `DELETE FROM booking WHERE id=${req.params.id}`;

    db.run(query, (err) => {
        if (err) {
            console.log(err);
            return res.status(500).send("Error deleting booking");
        }
        else
            return res.status(200).send(`booking with id ${req.params.id} deleted successfully`);
    });
});


app.listen(port, () => {       // listening on port 5005
    console.log(`Server started on port ${port}`)
    setInterval(() => {
        console.log(`Server is running on port: ${port}`);
    }, 7000)
});


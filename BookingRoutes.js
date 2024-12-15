const { verifyToken } = require("./userRoutes");

var BookingRoutes = function (app, db) {

app.put('/resturant/book',verifyToken, (req, res) => {
    const userId = req.user.id
    let name = req.body.name
    let date = req.body.date
    let time = req.body.time
    let quantity = parseInt(req.body.quantity, 10)
    let special_requests = req.body.special_requests

    if (!name || !date || !time || isNaN(quantity)) {
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
                const updateQuery = `UPDATE resturant SET availablecapacity = ? WHERE id = ?`;
                db.run(updateQuery, [available, resID], (err) => {
                    if (err) {
                        console.log(err)
                        return res.json(err)
                    }
                    else {
                        const bookingQuery = `INSERT INTO booking (user_id, restaurant_id, booking_date, booking_time, quantity, status, special_requests) 
                        VALUES (?, ?, ?, ?, ?, 'pending', ?)`;
                        db.run(bookingQuery, [userId, resID, date, time, quantity, special_requests], (err) => {
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


app.get('/bookings', verifyToken, (req, res) => {
    const query = 'SELECT * FROM booking';
    db.all(query, (err, rows) => {
        if (err) {
            console.log(err);
            return res.status(500).send("Error fetching bookings");
        }
        return res.json(rows); 
    });
});

app.get('/booking/:userId',verifyToken, (req, res) => {
    const userID = req.params.userId;

    if (req.user.id !== parseInt(userID, 10)) {
        return res.status(403).send('Access denied. You can only view your own bookings.');
    }

    const query = `SELECT * FROM booking WHERE user_id = ?`;

    db.all(query, [userID], (err, rows) => {
        if (err) {
            console.log(err);
            return res.status(500).send("Error fetching booking");
        }

        if (rows.length === 0) {
            return res.status(404).send(`No booking found with ID ${userID}`);
        }

        return res.json(rows);  // Return the booking data if found
    });
});

app.put('/booking/:bookingId',verifyToken, (req, res) => {
    const bookingId = req.params.bookingId;
    const { booking_date, booking_time, quantity, status, special_requests } = req.body;

    if (status && !['pending', 'confirmed', 'cancelled'].includes(status)) {
        return res.status(400).send('Invalid status. Allowed values are "pending", "confirmed", or "cancelled".');
    }

    const checkQuery = `SELECT * FROM booking WHERE id = ? AND user_id = ?`;
    db.get(checkQuery, [bookingId, req.user.id], (err, row) => {
        if (err) {
            return res.status(500).send('Error checking booking');
        }
        if (!row) {
            return res.status(404).send('Booking not found or you do not have permission to update it');
        }

        const updateQuery = `UPDATE booking 
            SET booking_date = COALESCE(?, booking_date),
                booking_time = COALESCE(?, booking_time),
                quantity = COALESCE(?, quantity),
                status = COALESCE(?, status),
                special_requests = COALESCE(?, special_requests)
            WHERE id = ? AND user_id = ?`;

        db.run(updateQuery, 
            [booking_date, booking_time, quantity, status, special_requests, bookingId, req.user.id],
            (err) => {
                if (err) {
                    console.error(err);
                    return res.status(500).send('Error updating booking');
                }
                return res.send('Booking updated successfully');
            }
        );
    });
});

app.delete('/booking/:id', verifyToken, (req, res) => {
    const bookingId = req.params.id;

    const checkQuery = `SELECT * FROM booking WHERE id = ? AND user_id = ?`;
        db.get(checkQuery, [bookingId, req.user.id], (err, row) => {
            if (err) {
                console.log(err);
                return res.status(500).send("Error checking booking existence");
            }

            if (!row) {
                return res.status(404).send(`No booking found with id ${bookingId}`);
            }

            const updateQuery = `UPDATE booking SET status = 'cancelled' WHERE id = ?`;

        db.run(updateQuery, [bookingId], (err) => {
        if (err) {
            console.log(err);
            return res.status(500).send("Error deleting booking");
        }
        else
            return res.status(200).send(`booking with id ${bookingId} cancelled successfully`);
    });
});
})
    
    return app;
}

module.exports = { BookingRoutes }
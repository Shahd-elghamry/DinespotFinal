const { verifyToken } = require("./userRoutes");

var ReviewRoutes = function (app, db) {

    app.post('/review',verifyToken, (req, res) => {
        const {restaurant_id, rating, review } = req.body;
        const user_id = req.user.id
    
        if (!restaurant_id || !rating) {
            return res.status(400).send('Missing required fields: restaurant_id, and rating are required.');
        }
    
        if (rating < 1 || rating > 5) {
            return res.status(400).send('Rating must be a number between 1 and 5.');
        }
    
        const query = `INSERT INTO review (user_id, restaurant_id, rating, review) 
        VALUES (?, ?, ?, ?)`;
    
        db.run(query, [user_id, restaurant_id, rating, review], function(err) {
            if (err) {
                console.log(err);
                return res.status(500).send('Error adding the review');
            }
    
            return res.status(201).send(`Review added successfully with ID ${this.lastID}`);
        });
    });    

    app.get('/review/:restaurantId', (req, res) => {
        const restaurantId = req.params.restaurantId;
        
        const query = `
            SELECT 
                r.*,
                u.username as userName
            FROM review r
            JOIN user u ON r.user_id = u.id
            WHERE r.restaurant_id = ?
            ORDER BY r.id DESC`;

        db.all(query, [restaurantId], (err, rows) => {
            if (err) {
                console.error(err);
                return res.status(500).send('Error retrieving reviews');
            }
            if (rows.length === 0) {
                return res.status(404).send('No reviews found for this restaurant');
            }
            return res.json(rows);
        });
    });

    app.get('/review/:userId', verifyToken, (req, res) => {
        const userId = req.params.userId;

        // Verify that the user is requesting their own reviews
        if (req.user.id !== parseInt(userId, 10)) {
            return res.status(403).send('Access denied. You can only view your own reviews.');
        }

        const query = `
            SELECT 
                r.*, 
                res.name as restaurant_name, 
                res.location as restaurant_location 
            FROM review r
            JOIN resturant res ON r.restaurant_id = res.id
            WHERE r.user_id = ?
            ORDER BY r.id DESC`;

        db.all(query, [userId], (err, rows) => {
            if (err) {
                console.error(err);
                return res.status(500).send('Error retrieving reviews');
            }
            if (rows.length === 0) {
                return res.status(404).send('No reviews found for this user');
            }
            return res.json(rows);
        });
    });

    app.delete('/review/:id',verifyToken, (req, res) => {
        const reviewID = req.params.id;
        const userID = req.user.id;

        const query = `DELETE FROM review WHERE id = ?`;
        const checkQuery = `SELECT * FROM review WHERE id = ?`;
        db.get(checkQuery, [reviewID], (err, row) => {
            if (err) {
                console.log(err);
                return res.status(500).send('Error fetching review');
            }

            if (!row) {
                return res.status(404).send('Review not found');
            }
    
            if (row.user_id !== userID && req.user.user_type !== 'admin') {
                return res.status(403).send('You are not authorized to delete this review');
            }

        db.run(query, [reviewID], (err) => {
            if (err) {
                console.log(err);
                return res.status(500).send("Error deleting review");
            }
            else
                return res.status(200).send(`review with id ${reviewID} deleted successfully`);
        });
    });
    });
    
    return app;
}

module.exports = { ReviewRoutes }
var ReviewRoutes = function (app, db) {

    app.post('/review', (req, res) => {
        const { user_id, restaurant_id, rating, review } = req.body;
    
        if (!user_id || !restaurant_id || !rating) {
            return res.status(400).send('Missing required fields: user_id, restaurant_id, and rating are required.');
        }
    
        if (rating < 1 || rating > 5) {
            return res.status(400).send('Rating must be a number between 1 and 5.');
        }
    
        const query = `INSERT INTO review (user_id, restaurant_id, rating, review) 
                       VALUES ('${user_id}', '${restaurant_id}', ${rating}, '${review}')`;
    
        db.run(query, function(err) {
            if (err) {
                console.log(err);
                return res.status(500).send('Error adding the review');
            }
    
            return res.status(201).send(`Review added successfully with ID ${this.lastID}`);
        });
    });    

    app.get('/review', (req, res) => {
        const query = 'SELECT * FROM review'
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


    app.delete('/review/:id', (req, res) => {
        const query = `DELETE FROM review WHERE id=${req.params.id}`;
    
        db.run(query, (err) => {
            if (err) {
                console.log(err);
                return res.status(500).send("Error deleting review");
            }
            else
                return res.status(200).send(`review with id ${req.params.id} deleted successfully`);
        });
    });
    
    return app;
}

module.exports = { ReviewRoutes }
const { verifyToken } = require("./userRoutes")

var RestaurantRoutes = function (app, db) {

    app.post('/addresturant',verifyToken, (req, res) => {
        let name = req.body.name
        let location = req.body.location
        let cuisine = req.body.cuisine
        let maxcapacity = parseInt(req.body.maxcapacity, 10)
        let halal = req.body.halal
        let min_of_health = req.body.min_of_health
        let dietary = req.body.dietary

        const owner_id = req.user.id; 

        if (req.user.user_type !== 'admin' && req.user.user_type !== 'restaurant_owner') {
            return res.status(403).send('Access denied: You are not authorized to add a restaurant');
        }

        const missingFields = [];
        if (!name) missingFields.push('name');
        if (!location) missingFields.push('location');
        if (!cuisine) missingFields.push('cuisine');

        if (missingFields.length > 0) {
            return res.status(400).send(`Missing required fields: ${missingFields.join(', ')}`);
        }

        const query = `
        INSERT INTO RESTAURANT 
        (name, location, cuisine, maxcapacity, availablecapacity, halal, min_of_health, dietary)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;

    db.run(
        query,
        [name, location, cuisine, maxcapacity, maxcapacity, halal, min_of_health, dietary],
        (err) => {
            if (err)
                return res.status(401).send(err)
            else
                return res.status(200).send('Added successfully')
        })
    })

    app.get('/resturant', (req, res) => {
        const query = 'SELECT * FROM RESTURANT'; 
        db.all(query, [], (err, rows) => { 
            if (err) {
                console.log(err);
                return res.status(500).send(err);
            } 
            else {
                return res.json(rows);
            }
        });
    });


    app.get('/resturant/search', (req, res) => {
        let { location, cuisine, dietary, halal } = req.query;
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


    app.put('/resturant/edit/:id',verifyToken, (req, res) => {
        const resID = parseInt(req.params.id, 10);
        const userID = req.user.id;  //Only admins or restaurant owners can access

        db.get('SELECT * FROM restaurant WHERE id = ?', [resID], (err, row) => {
            if (err) {
                console.log(err);
                return res.status(500).send('Error checking restaurant ownership.');
            }
    
            if (!row) {
                return res.status(404).send('Restaurant not found.');
            }

            if (req.user.user_type !== 'admin' && row.owner_id !== userID) {
                return res.status(403).send('You do not have permission to edit this restaurant.');
            }

        let name = req.body.name
        let location = req.body.location
        let cuisine = req.body.cuisine
        let maxcapacity = parseInt(req.body.maxcapacity, 10)
        let halal = req.body.halal
        let min_of_health = req.body.min_of_health
        let dietary = req.body.dietary
    
        let updates = []
        let params = []

        if (name) {
            updates.push('name = ?');
            params.push(name);
        }
        if (location) {
            updates.push('location = ?');
            params.push(location);
        }
        if (cuisine) {
            updates.push('cuisine = ?');
            params.push(cuisine);
        }
        if (maxcapacity) {
            updates.push('maxcapacity = ?');
            params.push(maxcapacity);
        }
        if (halal) {
            updates.push('halal = ?');
            params.push(halal);
        }
        if (min_of_health) {
            updates.push('min_of_health = ?');
            params.push(min_of_health);
        }
        if (dietary) {
            updates.push('dietary = ?');
            params.push(dietary);
        }
    
        if (updates.length === 0) {
            return res.status(400).send('No fields to update. Provide at least one field.');
        }
    
        params.push(resID);
        const query = `UPDATE restaurant SET ${updates.join(', ')} WHERE ID = ?`;
    
        db.run(query, params, function (err) {
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
})
    

    app.delete('/resturant/:id',verifyToken, (req, res) => {
        const resID = parseInt(req.params.id, 10);
        const userID = req.user.id; 
        db.get('SELECT * FROM resturant WHERE id = ?', [resID], (err, row) => {
            if (err) {
                console.log(err);
                return res.status(500).send('Error fetching restaurant');
            }
    
            if (!row) {
                return res.status(404).send('Restaurant not found');
            }

            if (req.user.user_type !== 'admin' && row.owner_id !== userID) {
                return res.status(403).send('You are not authorized to delete this restaurant');
            }
     
            const query = 'DELETE FROM resturant WHERE id = ?';

        db.run(query, [resID], (err) => {
            if (err) {
                console.log(err);
                return res.status(500).send("Error deleting restaurant");
            }
            else
                return res.status(200).send(`Restaurant with id ${req.params.id} deleted successfully`);
        });
    });
})

    return app;
}
module.exports = { RestaurantRoutes }
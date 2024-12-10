const express = require('express');
var app = express();
const port = 5005;
app.use(express.json());
const db_access = require('./database');
const user_Routes = require('./userRoutes');
const resturant_routes = require('./ResturantRoutes');
const review_routes = require('./ReviewRoutes')
const contact_routes = require('./ContactRoutes')
const booking_routes = require('./BookingRoutes')
const db = db_access.db;
const cors = require('cors')
app.use(cors())

//Just to verify the website works
app.get('/', (req, res) => { 
    res.send("Hello World!");
})
app = user_Routes.UserRoutes(app, db);
app = resturant_routes.RestaurantRoutes(app,db);
app = review_routes.ReviewRoutes(app,db);
app = contact_routes.ContactRoutes(app,db); 
app = booking_routes.BookingRoutes(app,db);







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


app.listen(port, () => {       // listening on port 5005
    console.log(`Server started on port ${port}`)
    setInterval(() => {
        console.log(`Server is running on port: ${port}`);
    }, 7000)
});


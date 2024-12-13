
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('dinespot.db');

const createUserTable = `
    CREATE TABLE IF NOT EXISTS user (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL,
        phonenum TEXT NOT NULL,
        user_type TEXT NOT NULL
    )`

const createResturantTable = `
    CREATE TABLE IF NOT EXISTS resturant (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        location TEXT NOT NULL ,
        cuisine TEXT NOT NULL,
        halal TEXT,
        minHealthRating TEXT,
        maxcapacity INT NOT NULL,
        dietary TEXT ,
        availablecapacity INT NOT NULL,
        owner_id INTEGER NOT NULL, 
        FOREIGN KEY (owner_id) REFERENCES user(id)
    )`

const createBookingTable = `
    CREATE TABLE IF NOT EXISTS booking (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        restaurant_id INTEGER NOT NULL,
        booking_date TEXT NOT NULL,
        booking_time TEXT NOT NULL,
        quantity INTEGER NOT NULL,
        status TEXT NOT NULL DEFAULT 'pending',
        FOREIGN KEY (user_id) REFERENCES user(id),
        FOREIGN KEY (restaurant_id) REFERENCES restaurant(id)
    )`;

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

const createContactTable = `
CREATE TABLE IF NOT EXISTS contact (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT NOT NULL,
    question TEXT NOT NULL
    )`

    /////FOREIGN KEY (email) REFERENCES user(email)

    
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
    
module.exports = {db, createResturantTable, createUserTable, createBookingTable, createReviewTable, createContactTable}
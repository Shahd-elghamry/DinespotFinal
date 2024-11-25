
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('dinespot.db');

const createUserTable = `
    CREATE TABLE IF NOT EXISTS user (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL,
        user_type TEXT NOT NULL,
    );
`; // created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP

const createResturantTable = `
    CREATE TABLE IF NOT EXISTS resturant (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        location TEXT NOT NULL ,
        cuisine TEXT NOT NULL,
    );
`; // created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP

const createBookingTable=`
    CREATE TABLE IF NOT EXISTS booking (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        restaurant_id INTEGER NOT NULL,
        booking_date TEXT NOT NULL,
        booking_time TEXT NOT NULL,
        quantity INTEGER NOT NULL,
        FOREIGN KEY (user_id) REFERENCES user(id),
        FOREIGN KEY (restaurant_id) REFERENCES restaurant(id)
    );
`; //        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

const createReviewTable=`
CREATE TABLE IF NOT EXISTS review (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,            
    restaurant_id INTEGER NOT NULL,      
    rating INTEGER NOT NULL,     
    review TEXT,                          
    FOREIGN KEY (user_id) REFERENCES user(id),
    FOREIGN KEY (restaurant_id) REFERENCES restaurant(id)
    );`;
    // created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    

module.exports=(db,createResturantTable,createUserTable,createBookingTable,createReviewTable)
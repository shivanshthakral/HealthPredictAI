const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');
const path = require('path');
const fs = require('fs');

// Ensure data directory exists
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir);
}

// Initialize Adapters
const usersAdapter = new FileSync(path.join(dataDir, 'users.json'));
const ordersAdapter = new FileSync(path.join(dataDir, 'orders.json'));

const db = {
    users: low(usersAdapter),
    orders: low(ordersAdapter)
};

// Set defaults
db.users.defaults({ users: [] }).write();
db.orders.defaults({ orders: [] }).write();

module.exports = db;

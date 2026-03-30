const express = require('express');
const { Pool } = require('pg');
const dotenv = require('dotenv').config();

// Create express app
const app = express();
const port = 3000;
app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use('/cashier', express.static('views/Cashier'));
// Create pool
const pool = new Pool({
    user: process.env.PSQL_USER,
    host: process.env.PSQL_HOST,
    database: process.env.PSQL_DATABASE,
    password: process.env.PSQL_PASSWORD,
    port: process.env.PSQL_PORT,
    ssl: {rejectUnauthorized: false}
});

// Add process hook to shutdown pool
process.on('SIGINT', function() {
    pool.end();
    console.log('Application successfully shutdown');
    process.exit(0);
});
	 	 	 	
app.get('/', (req, res) => {
    teammembers = []
    pool
        .query('SELECT * FROM teammembers;')
        .then(query_res => {
            for (let i = 0; i < query_res.rowCount; i++){
                teammembers.push(query_res.rows[i]);
            }
            const data = {teammembers: teammembers};
            console.log(teammembers);
            res.render('index', data);
        });
});

app.get('/inventory', (req, res) => {
    inventory = []
    pool
        .query('SELECT * FROM inventory ORDER BY ingredient_id ASC;')
        .then(query_res => {
            for (let i = 0; i < query_res.rowCount; i++){
                inventory.push(query_res.rows[i]);
            }
            const data = {inventory: inventory};
            console.log(inventory);
            res.render('inventory', data);
        });
});

//Handles adding an ingredient to the inventory
app.post('/add-ingredient', (req, res) => {
    const { ingredient, quantity } = req.body;

    const query = 'INSERT INTO inventory (ingredient, quantity) VALUES ($1, $2)';
    
    pool.query(query, [ingredient, quantity])
        .then(() => {
            // After adding, send them back to the inventory page to see the update
            res.redirect('/inventory');
        })
        .catch(err => {
            console.error(err);
            res.status(500).send("Error adding ingredient");
        });
});
app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`);
});


/** CASHIER VIEW */
let activeOrders = []
let orderCounter = 1; // Simple counter to assign order IDs

app.get('/order-screen', (req, res) => {
    // Make sure this table name matches 'menu' from your screenshot
    pool.query('SELECT * FROM menu ORDER BY item_id ASC;') 
        .then(query_res => {
            res.render('Cashier/order-screen', { items: query_res.rows });
        })
        .catch(err => {
            console.error(err);
            res.status(500).send("Error fetching menu items");
        });
});

app.get('/active-orders', (req, res) => {
    // Pass the activeOrders array to the EJS template
    res.render('Cashier/active-orders', { orders: activeOrders });
});

app.get('/cart', (req, res) => {
    // We don't need to pass database items here yet, 
    // because the cart lives in the browser's LocalStorage!
    res.render('Cashier/cart'); 
});

app.post('/api/checkout', (req, res) => {
    const { items } = req.body;

    if (!items || items.length === 0) {
        return res.status(400).send("No items in cart");
    }

    // Create a new order object for the active list
    const newOrder = {
        id: orderCounter++,
        items: items, // This is the array of {name, price}
        timestamp: new Date().toLocaleString()
    };

    activeOrders.push(newOrder);
    console.log(`Order #${newOrder.id} added to active orders.`);
    
    res.status(200).json({ success: true });
});

app.post('/api/complete-order/:id', async (req, res) => {
    const orderId = parseInt(req.params.id);
    const orderIndex = activeOrders.findIndex(o => o.id === orderId);

    if (orderIndex > -1) {
        const orderToSave = activeOrders[orderIndex];

        try {
            // EXAMPLE: Saving the total to a 'sales' or 'history' table
            // You'll need to adjust this to match your actual table columns
            const total = orderToSave.items.reduce((sum, item) => sum + Number(item.price), 0);
            
            await pool.query('INSERT INTO order_history (order_id, total_price) VALUES ($1, $2)', [orderToSave.id, total]);

            // Remove from temporary server list
            activeOrders.splice(orderIndex, 1);
            res.status(200).send("Order finalized and saved to DB");
        } catch (err) {
            console.error(err);
            res.status(500).send("Error saving to database");
        }
    } else {
        res.status(404).send("Order not found");
    }
});
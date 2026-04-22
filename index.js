const express = require('express');
const { Pool } = require('pg');
const session = require('express-session');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const dotenv = require('dotenv').config();

// Create express app
const app = express();
const port = 3000;
app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use('/cashier', express.static('views/Cashier'));
app.use('/customer', express.static('views/Customer'));
app.use('/manager', express.static('views/Manager'));
app.use('/portal', express.static('views/Portal'));
app.use('/menu', express.static('views/Menu'));

// Create pool
const pool = new Pool({
    user: process.env.PSQL_USER,
    host: process.env.PSQL_HOST,
    database: process.env.PSQL_DATABASE,
    password: process.env.PSQL_PASSWORD,
    port: process.env.PSQL_PORT,
    ssl: { rejectUnauthorized: false }
});

// Add process hook to shutdown pool
process.on('SIGINT', function () {
    pool.end();
    console.log('Application successfully shutdown');
    process.exit(0);
});

app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

passport.use(new GoogleStrategy({
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: process.env.CALLBACK_URL || '/auth/google/callback'
    },
    function (accessToken, refreshToken, profile, done) {
        return done(null, profile);
    }
));

passport.serializeUser(function (user, done) {
    done(null, user);
});

passport.deserializeUser(function (user, done) {
    done(null, user);
});

function isAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    }
    res.redirect('/login');
}

app.get('/login', (req, res) => {
    res.render('Portal/login');
});

app.get('/auth/google',
    passport.authenticate('google', { scope: ['profile', 'email'] })
);

app.get('/auth/google/callback',
    passport.authenticate('google', { failureRedirect: '/login' }),
    (req, res) => {
        res.redirect('/');
    }
);

app.get('/logout', (req, res) => {
    req.logout(function (err) {
        if (err) { console.error(err); }
        res.redirect('/login');
    });
});

//Portal stuff
app.get('/', isAuthenticated, (req, res) => {
    teammembers = [];
    pool
        .query('SELECT * FROM teammembers;')
        .then(query_res => {
            for (let i = 0; i < query_res.rowCount; i++) {
                teammembers.push(query_res.rows[i]);
            }
            const data = { teammembers: teammembers, user: req.user };
            console.log(teammembers);
            res.render('Portal/portal', data);
        });
});


/** MANAGER VIEW */
// Initializes inventory
app.get('/inventory', isAuthenticated, (req, res) => {
    inventory = [];
    pool
        .query('SELECT * FROM inventory ORDER BY ingredient_id ASC;')
        .then(query_res => {
            for (let i = 0; i < query_res.rowCount; i++) {
                inventory.push(query_res.rows[i]);
            }
            const data = { inventory: inventory };
            console.log(inventory);
            res.render('Manager/inventory', data);
        });
});

// Handles adding an ingredient to the inventory
app.post('/add-ingredient', isAuthenticated, (req, res) => {
    const { ingredient, quantity } = req.body;
    const query = 'INSERT INTO inventory (ingredient, quantity) VALUES ($1, $2)';
    pool.query(query, [ingredient, quantity])
        .then(() => res.redirect('/inventory'))
        .catch(err => {
            console.error(err);
            res.status(500).send("Error adding ingredient");
        });
});

// Delete ingredient
app.post('/delete-ingredient', isAuthenticated, (req, res) => {
    const { ingredient } = req.body;
    const query = "DELETE FROM inventory WHERE ingredient = $1";
    pool.query(query, [ingredient])
        .then(() => res.redirect('/inventory'))
        .catch(err => {
            console.error(err);
            res.status(500).send("Error deleting ingredient");
        });
});

// Update ingredient quantity
app.post('/update-ingredient', isAuthenticated, (req, res) => {
    const { ingredient_id, quantity } = req.body;
    const query = "UPDATE inventory SET quantity = $2 WHERE ingredient_id = $1";
    pool.query(query, [ingredient_id, quantity])
        .then(() => res.redirect('/inventory'))
        .catch(err => {
            console.error(err);
            res.status(500).send("Error updating quantity");
        });
});

// Initializes employee view table
app.get('/employee', isAuthenticated, (req, res) => {
    employees = [];
    pool
        .query('SELECT * FROM employees ORDER BY employee_id ASC;')
        .then(query_res => {
            for (let i = 0; i < query_res.rowCount; i++) {
                employees.push(query_res.rows[i]);
            }
            const data = { employees: employees };
            console.log(employees);
            res.render('Manager/employee', data);
        });
});

// Handles adding an employee to employee
app.post('/add-employee', isAuthenticated, (req, res) => {
    const { employee_id, employee_name, hours } = req.body;
    const query = "INSERT INTO employees (employee_id, employee_name, hours) VALUES ($1, $2, $3) ON CONFLICT (employee_id) DO UPDATE SET employee_name = EXCLUDED.employee_name, hours = EXCLUDED.hours";
    pool.query(query, [employee_id, employee_name, hours])
        .then(() => res.redirect('/employee'))
        .catch(err => {
            console.error(err);
            res.status(500).send("Error adding employee");
        });
});

// Delete an employee
app.post('/delete-employee', isAuthenticated, (req, res) => {
    const { employee_id } = req.body;
    const query = "DELETE FROM employees WHERE employee_id = $1";
    pool.query(query, [employee_id])
        .then(() => res.redirect('/employee'))
        .catch(err => {
            console.error(err);
            res.status(500).send("Error deleting employee");
        });
});

// Initializes menu view table
app.get('/menu', isAuthenticated, (req, res) => {
    pool.query('SELECT * FROM menu ORDER BY item_id ASC;')
        .then(result => {
            res.render('Manager/menu', { menu: result.rows });
        })
        .catch(err => {
            console.error("Error loading menu:", err);
            res.status(500).send("Error loading menu");
        });
});

// Handles adding a menu item to menu
app.post('/add-menu-item', isAuthenticated, (req, res) => {
    const { item_name, cost, ingredients } = req.body;
    const query = `
        INSERT INTO menu (item_name, cost, ingredients)
        VALUES ($1, $2, $3)
        ON CONFLICT (item_name) DO UPDATE
        SET cost = EXCLUDED.cost
    `;
    pool.query(query, [item_name, cost, ingredients])
        .then(() => res.redirect('/menu'))
        .catch(err => {
            console.error("Error saving menu item:", err);
            res.status(500).send("Error saving menu item");
        });
});

// Edit a menu item
app.post('/edit-menu-item', (req, res) => {
    const { item_id, cost, ingredients } = req.body;
    const query = "UPDATE menu SET cost = $2, ingredients = $3 WHERE item_id = $1";
    pool.query(query, [item_id, cost, ingredients])
        .then(() => res.redirect('/menu'))
        .catch(err => {
            console.error("Error updating menu item:", err);
            res.status(500).send("Error updating menu item");
        });
});
// Delete a menu item
app.post('/delete-menu-item', isAuthenticated, (req, res) => {
    const { item_id } = req.body;
    const query = "DELETE FROM menu WHERE item_id = $1";
    pool.query(query, [item_id])
        .then(() => res.redirect('/menu'))
        .catch(err => {
            console.error("Error deleting menu item:", err);
            res.status(500).send("Error deleting menu item");
        });
});

// Order Report Page
let lastZReport = null;
app.get('/order-report', (req, res) => {
    res.render('Manager/order-report');
});

// X Rerport
app.post('/api/x-report', async (req, res) => {
    const { date, hour } = req.body;

    if (!date || hour === undefined) {
        return res.status(400).json({ error: "Missing date or hour" });
    }

    // Initialize lastZReport
    if (!lastZReport) {
        lastZReport = new Date(date);
        lastZReport.setDate(lastZReport.getDate() - 1);
    }

    const lastZString = lastZReport.toISOString().slice(0, 10);

    const sql = `
        SELECT hour, SUM(quantity) AS quantity, SUM(subtotal) AS subtotal
        FROM orders
        WHERE date = $1
        AND hour <= $2
        AND date > $3
        GROUP BY hour
        ORDER BY hour ASC;
    `;

    try {
        const result = await pool.query(sql, [date, hour, lastZString]);
        res.json({ rows: result.rows });
    } catch (err) {
        console.error("Error generating X report:", err);
        res.status(500).json({ error: "Error generating X report" });
    }
});

// Z Report
app.post('/api/z-report', async (req, res) => {
    const { date } = req.body;

    if (!date) {
        return res.status(400).json({ error: "Missing date" });
    }

    // Duplicate check
    if (lastZReport && lastZReport.toISOString().slice(0, 10) === date) {
        return res.json({ message: "Already ran Z-report today", data: null });
    }

    const sql = `
        SELECT
            SUM(quantity) AS total_quantity,
            SUM(subtotal) AS total_sales
        FROM orders
        WHERE date = $1;
    `;

    try {
        const result = await pool.query(sql, [date]);
        const row = result.rows[0];

        lastZReport = new Date(date);

        res.json({
            total_quantity: row.total_quantity || 0,
            total_sales: row.total_sales || 0
        });
    } catch (err) {
        console.error("Error generating Z report:", err);
        res.status(500).json({ error: "Error generating Z report" });
    }
});

// Combined Sales + Product Usage page
app.get('/stats', (req, res) => {
    res.render('Manager/stats');
});


// Sales Report
app.get('/api/sales-report', async (req, res) => {
    const { start, end } = req.query;

    if (!start || !end) {
        return res.status(400).json({ error: "Missing start or end date" });
    }

    const sql = `
        SELECT o.item_name,
               SUM(o.quantity * m.cost) AS revenue
        FROM orders o
        JOIN menu m ON o.item_name = m.item_name
        WHERE o.date BETWEEN $1 AND $2
        GROUP BY o.item_name
        ORDER BY revenue DESC;
    `;

    try {
        const result = await pool.query(sql, [start, end]);
        res.json(result.rows);
    } catch (err) {
        console.error("Error generating sales report:", err);
        res.status(500).json({ error: "Error generating sales report" });
    }
});

// Product Usage Report
app.get('/api/product-usage', async (req, res) => {
    const { start, end } = req.query;

    if (!start || !end) {
        return res.status(400).json({ error: "Missing start or end date" });
    }

    const sql = `
        SELECT 
            TRIM(ingredient) AS ingredient_name,
            COUNT(*) AS ingredient_usage
        FROM (
            SELECT 
                unnest(string_to_array(m.ingredients, ',')) AS ingredient
            FROM orders o
            JOIN menu m ON o.item_id = m.item_id
            WHERE o.date BETWEEN $1 AND $2
        ) AS ingredient_list
        GROUP BY TRIM(ingredient)
        ORDER BY ingredient_usage DESC;
    `;

    try {
        const result = await pool.query(sql, [start, end]);
        res.json(result.rows);
    } catch (err) {
        console.error("Error generating product usage report:", err);
        res.status(500).json({ error: "Error generating product usage report" });
    }
});



/** CASHIER VIEW */
let activeOrders = [];
let orderCounter = 1; // Simple counter to assign order IDs


// SQL query to load menu items when cashier screen is rendered
app.get('/cashier-order-screen', isAuthenticated, (req, res) => {
    pool.query('SELECT * FROM menu ORDER BY item_id ASC;')
        .then(query_res => {
            res.render('Cashier/cashier-order-screen', { items: query_res.rows });
        })
        .catch(err => {
            console.error(err);
            res.status(500).send("Error fetching menu items");
        });
});

// Active orders page for cashier
app.get('/active-orders', isAuthenticated, (req, res) => {
    res.render('Cashier/active-orders', { orders: activeOrders });
});

// Cart page for cashier
app.get('/cart', isAuthenticated, (req, res) => {
    res.render('Cashier/cart');
});

// Checkout endpoint for cashier - receives cart items and adds to active orders 
app.post('/api/checkout', (req, res) => {
    const { items } = req.body;
    if (!items || items.length === 0) {
        return res.status(400).send("No items in cart");
    }

    const newOrder = {
        id: orderCounter++,
        items: items,
        timestamp: new Date().toLocaleString()
    };

    activeOrders.push(newOrder);
    console.log(`Order #${newOrder.id} added to active orders.`);
    res.status(200).json({ success: true });
});

const crypto = require('crypto');   // Crypto module for generating unique receipt IDs

app.post('/api/complete-order/:id', async (req, res) => {
    const activeOrderId = parseInt(req.params.id);
    const orderIndex = activeOrders.findIndex(o => o.id === activeOrderId);

    if (orderIndex > -1) {
        const orderToSave = activeOrders[orderIndex];
        const receiptId = crypto.randomUUID();
        const now = new Date();

        try {
            const maxIdResult = await pool.query('SELECT MAX(order_id) FROM orders');
            const nextDbOrderId = (maxIdResult.rows[0].max || 0) + 1;

            // Calculate date components for orders table
            const startOfYear = new Date(now.getFullYear(), 0, 0);
            const diff = now - startOfYear;
            const oneDay = 1000 * 60 * 60 * 24;
            const dayIndex = Math.floor(diff / oneDay);
            const weekIndex = Math.floor(dayIndex / 7);
            const dayOfWeek = now.getDay();
            const hour = now.getHours();
            const dateString = now.toISOString().split('T')[0];

            // Group items by name to calculate quantity and subtotal
            const groupedItems = {};
            orderToSave.items.forEach(item => {
                if (groupedItems[item.name]) {
                    groupedItems[item.name].quantity += 1;
                } else {
                    groupedItems[item.name] = { price: item.price, quantity: 1 };
                }
            });

            for (const itemName in groupedItems) {
                const itemData = groupedItems[itemName];
                const subtotal = itemData.price * itemData.quantity;
                const menuResult = await pool.query('SELECT item_id FROM menu WHERE item_name = $1', [itemName]);
                const itemId = menuResult.rows.length > 0 ? menuResult.rows[0].item_id : null;

                // Insert each item in the order into the orders table
                await pool.query(
                    `INSERT INTO orders (
                        order_id, receipt_id, date, week_index, day_index, 
                        day_of_we, is_peak_da, hour, item_id, item_name, 
                        unit_price, quantity, subtotal
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
                    [
                        nextDbOrderId, 
                        receiptId, 
                        dateString, 
                        weekIndex, 
                        dayIndex, 
                        dayOfWeek,
                        'f', 
                        hour, 
                        itemId,
                        itemName,           
                        itemData.price,   
                        itemData.quantity,  
                        subtotal            
                    ]
                );
            }

            activeOrders.splice(orderIndex, 1);
            res.status(200).json({ success: true });
            
        } catch (err) {
            console.error("DATABASE INSERT ERROR:", err);
            res.status(500).json({ success: false, error: err.message });
        }
    } else {
        res.status(404).json({ success: false, message: "Order not found" });
    }
});

/** CUSTOMER VIEW */

// SQL query to load menu items when customer screen is rendered
app.get('/customer', (req, res) => {
    pool.query('SELECT * FROM menu ORDER BY item_id ASC;')
        .then(query_res => {
            res.render('Customer/customer_menu', { menu: query_res.rows });
        })
        .catch(err => {
            console.error("Error fetching menu for customer:", err);
            res.status(500).send("Error loading menu");
        });
});

// Renders the cart for customer view
app.get('/customer/cart', (req, res) => {
    res.render('Customer/cart');
});

// Renders the checkout for customer view
app.get('/customer/checkout', (req, res) => {
    res.render('Customer/checkout');
});

// Renders the order confirmation for customer view
app.get('/customer/order-confirmation', (req, res) => {
    res.render('Customer/order_confirmation');
});

// app response and error handling for cart in customer view
app.post('/api/customer-checkout', (req, res) => {
    const { items } = req.body;
    if (!items || items.length === 0) {
        return res.status(400).json({ error: "No items in cart" });
    }

    const newOrder = {
        id: orderCounter++,
        items: items,
        timestamp: new Date().toLocaleString()
    };

    activeOrders.push(newOrder);
    console.log(`Customer Order #${newOrder.id} placed.`);
    res.status(200).json({ success: true });
});


/* MENU VIEW */

// SQL query to load menu items when menu-board is rendered
app.get('/menu-board', (req, res) => {
    pool.query('SELECT * FROM menu ORDER BY item_id ASC;')
        .then(query_res => {
            res.render('Menu/menu-board', { menu: query_res.rows });
        })
        .catch(err => {
            console.error("Error fetching menu for menu-board:", err);
            res.status(500).send("Error loading menu-board");
        });
});


app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`);
});

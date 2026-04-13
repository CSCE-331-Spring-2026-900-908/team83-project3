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
        callbackURL: '/auth/google/callback'
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

//Initializes inventory
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

//Handles adding an ingredient to the inventory
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

//delete ingredient
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

//update ingredient quantity
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

//Initializes employee view table
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

//Handles adding an employee to employee
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

//Delete an employee
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

//Initializes menu view table
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

//Handles adding a menu item to menu
app.post('/add-menu-item', isAuthenticated, (req, res) => {
    const { item_name, cost, ingredients } = req.body;
    const query = `
        INSERT INTO menu (item_name, cost, ingredients)
        VALUES ($1, $2, $3)
        ON CONFLICT (item_name) DO UPDATE
        SET cost = EXCLUDED.cost,
            ingredients = EXCLUDED.ingredients
    `;
    pool.query(query, [item_name, cost, ingredients])
        .then(() => res.redirect('/menu'))
        .catch(err => {
            console.error("Error saving menu item:", err);
            res.status(500).send("Error saving menu item");
        });
});

//Delete a menu item
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

/** CASHIER VIEW */
let activeOrders = [];
let orderCounter = 1; // Simple counter to assign order IDs

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

app.get('/active-orders', isAuthenticated, (req, res) => {
    res.render('Cashier/active-orders', { orders: activeOrders });
});

app.get('/cart', isAuthenticated, (req, res) => {
    res.render('Cashier/cart');
});

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

app.post('/api/complete-order/:id', async (req, res) => {
    const orderId = parseInt(req.params.id);
    const orderIndex = activeOrders.findIndex(o => o.id === orderId);

    if (orderIndex > -1) {
        const orderToSave = activeOrders[orderIndex];
        try {
            const total = orderToSave.items.reduce((sum, item) => sum + Number(item.price), 0);
            await pool.query('INSERT INTO order_history (order_id, total_price) VALUES ($1, $2)', [orderToSave.id, total]);
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

app.get('/customer', (req, res) => {
    const lang = req.query.lang || 'en';
    pool.query('SELECT * FROM menu ORDER BY item_id ASC;')
        .then(query_res => {
            res.render('Customer/customer_menu', { menu: query_res.rows, lang: lang });
        })
        .catch(err => {
            console.error("Error fetching menu for customer:", err);
            res.status(500).send("Error loading menu");
        });
});

app.get('/customer/cart', (req, res) => {
    const lang = req.query.lang || 'en';
    res.render('Customer/cart', { lang: lang });
});

app.get('/customer/checkout', (req, res) => {
    const lang = req.query.lang || 'en';
    res.render('Customer/checkout', { lang: lang });
});

app.get('/customer/order-confirmation', (req, res) => {
    const lang = req.query.lang || 'en';
    res.render('Customer/order_confirmation', { lang: lang });
});

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

app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`);
});
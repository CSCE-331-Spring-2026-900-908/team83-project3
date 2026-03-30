const express = require('express');
const { Pool } = require('pg');
const dotenv = require('dotenv').config();

// Create express app
const app = express();
const port = 5500;
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

//Portal stuff
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
            res.render('Portal/portal', data);
        });
});

//Initializes inventory
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
            res.render('Manager/inventory', data);
        });
});

//Handles adding an ingredient to the inventory
app.post('/add-ingredient', (req, res) => {
    const { ingredient, quantity } = req.body;

    const query = 'INSERT INTO inventory (ingredient, quantity) VALUES ($1, $2)';
    
    pool.query(query, [ingredient, quantity])
        .then(() => {
            res.redirect('Manager/inventory');
        })
        .catch(err => {
            console.error(err);
            res.status(500).send("Error adding ingredient");
        });
});

//delete ingredient
app.post('/delete-ingredient', (req, res) => {
    const {ingredient} = req.body;

    const query = "DELETE FROM inventory WHERE ingredient = $1";

    pool.query(query, [ingredient])
        .then(() => {
            res.redirect('Manager/inventory');
        })
        .catch(err => {
            console.error(err);
            res.status(500).send("Error deleting ingredient");
        });
});

//Initializes employee view table
app.get('/employee', (req, res) => {
    employees = []
    pool
        .query('SELECT * FROM employees ORDER BY employee_id ASC;')
        .then(query_res => {
            for (let i = 0; i < query_res.rowCount; i++){
                employees.push(query_res.rows[i]);
            }
            const data = {employees: employees};
            console.log(employees);
            res.render('Manager/employee', data);
        });
});

//Handles adding an employee to employee
app.post('/add-employee', (req, res) => {
    const { employee_id, employee_name, hours } = req.body;

    const query = "INSERT INTO employees (employee_id, employee_name, hours) VALUES ($1, $2, $3) ON CONFLICT (employee_id) DO UPDATE SET employee_name = EXCLUDED.employee_name, hours = EXCLUDED.hours";
    
    pool.query(query, [employee_id, employee_name, hours])
        .then(() => {
            res.redirect('Manager/employee');
        })
        .catch(err => {
            console.error(err);
            res.status(500).send("Error adding employee");
        });
});

//Delete an employee
app.post('/delete-employee', (req, res) => {
    const {employee_id} = req.body;

    const query = "DELETE FROM employees WHERE employee_id = $1";

    pool.query(query, [employee_id])
        .then(() => {
            res.redirect('Manager/employee');
        })
        .catch(err => {
            console.error(err);
            res.status(500).send("Error deleting employee");
        });
});

//Initializes menu view table
app.get('/menu', (req, res) => {
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
app.post('/add-menu-item', (req, res) => {
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
app.post('/delete-menu-item', (req, res) => {
    const { item_id } = req.body;

    const query = "DELETE FROM menu WHERE item_id = $1";

    pool.query(query, [item_id])
        .then(() => res.redirect('/menu'))
        .catch(err => {
            console.error("Error deleting menu item:", err);
            res.status(500).send("Error deleting menu item");
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
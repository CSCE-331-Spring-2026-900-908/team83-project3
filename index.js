const express = require('express');
const { Pool } = require('pg');
const dotenv = require('dotenv').config();

// Create express app
const app = express();
const port = 3000;
app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
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
            res.render('portal', data);
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

//Initializes employee view table
app.get('/employee', (req, res) => {
    employees = []
    pool
        .query('SELECT * FROM employee ORDER BY employee_id ASC;')
        .then(query_res => {
            for (let i = 0; i < query_res.rowCount; i++){
                employees.push(query_res.rows[i]);
            }
            const data = {employees: employees};
            console.log(employees);
            res.render('employees', data);
        });
});

//Handles adding an employee to employee
app.post('/add-employee', (req, res) => {
    const { employee_name, hours } = req.body;

    const query = 'INSERT INTO employees (employee_name, hours) VALUES ($1, $2)';
    
    pool.query(query, [employee_name, hours])
        .then(() => {
            res.redirect('/employee');
        })
        .catch(err => {
            console.error(err);
            res.status(500).send("Error adding employee");
        });
});

app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`);
});

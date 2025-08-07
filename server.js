const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const path = require('path');
const app = express();
const PORT = 3000;

// Middleware
app.use(express.json());
app.use(express.static(__dirname));

// SQLite DB setup
const db = new sqlite3.Database('workoutvibes.db', (err) => {
    if (err) return console.error(err.message);
    console.log('Connected to SQLite database.');
});
db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL
)`);




// --- SHOP DB SETUP ---



const shopDB = new sqlite3.Database('shop.db', (err) => {
    if (err) return console.error(err.message);
    console.log('Connected to Shop SQLite database.');
});
shopDB.serialize(() => {
    shopDB.run(`CREATE TABLE IF NOT EXISTS products (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        description TEXT,
        image TEXT,
        price REAL NOT NULL
    )`);
    shopDB.run(`CREATE TABLE IF NOT EXISTS cart (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_email TEXT NOT NULL,
        product_id INTEGER NOT NULL,
        quantity INTEGER NOT NULL DEFAULT 1
    )`);
    shopDB.run(`CREATE TABLE IF NOT EXISTS orders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_email TEXT NOT NULL,
        order_time DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);
    shopDB.run(`CREATE TABLE IF NOT EXISTS order_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        order_id INTEGER NOT NULL,
        product_id INTEGER NOT NULL,
        quantity INTEGER NOT NULL
    )`);
});





// --- MEMBERSHIP TABLE ---
shopDB.run(`CREATE TABLE IF NOT EXISTS memberships (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_email TEXT NOT NULL,
    plan TEXT NOT NULL,
    start_date DATETIME NOT NULL,
    end_date DATETIME NOT NULL
)`);

// Signup endpoint
app.post('/api/signup', (req, res) => {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
        return res.json({ success: false, message: 'All fields required.' });
    }
    db.get('SELECT * FROM users WHERE email = ?', [email], (err, row) => {
        if (row) {
            return res.json({ success: false, message: 'Email already registered.' });
        }
        const hash = bcrypt.hashSync(password, 10);
        db.run('INSERT INTO users (name, email, password) VALUES (?, ?, ?)', [name, email, hash], function(err) {
            if (err) return res.json({ success: false, message: 'Signup failed.' });
            res.json({ success: true });
        });
    });
});

// Login endpoint
app.post('/api/login', (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.json({ success: false, message: 'All fields required.' });
    }
    db.get('SELECT * FROM users WHERE email = ?', [email], (err, user) => {
        if (!user) {
            return res.json({ success: false, message: 'User not found.' });
        }
        if (!bcrypt.compareSync(password, user.password)) {
            return res.json({ success: false, message: 'Incorrect password.' });
        }
        res.json({ success: true, userName: user.name });
    });
});

// Helper: Check if user_email is a real registered user
function isRegisteredUser(user_email, callback) {
    if (!user_email || user_email.trim() === '') return callback(false);
    db.get('SELECT * FROM users WHERE email = ?', [user_email], (err, user) => {
        if (err || !user) return callback(false);
        callback(true);
    });
}

// --- PRODUCTS ENDPOINT ---
app.get('/api/products', (req, res) => {
    shopDB.all('SELECT * FROM products', (err, rows) => {
        if (err) return res.status(500).json({ success: false, message: 'DB error' });
        res.json({ success: true, products: rows });
    });
});

// --- CART ENDPOINTS ---
app.post('/api/cart', (req, res) => {
    const { user_email, product_id, quantity } = req.body;
    isRegisteredUser(user_email, (isValid) => {
        if (!isValid || !product_id) return res.json({ success: false, message: 'Not authenticated' });
        shopDB.get('SELECT * FROM cart WHERE user_email = ? AND product_id = ?', [user_email, product_id], (err, row) => {
            if (row) {
                shopDB.run('UPDATE cart SET quantity = quantity + ? WHERE user_email = ? AND product_id = ?', [quantity || 1, user_email, product_id], function(err) {
                    if (err) return res.json({ success: false });
                    res.json({ success: true });
                });
            } else {
                shopDB.run('INSERT INTO cart (user_email, product_id, quantity) VALUES (?, ?, ?)', [user_email, product_id, quantity || 1], function(err) {
                    if (err) return res.json({ success: false });
                    res.json({ success: true });
                });
            }
        });
    });
});

app.get('/api/cart', (req, res) => {
    const user_email = req.query.user_email;
    isRegisteredUser(user_email, (isValid) => {
        if (!isValid) return res.json({ success: false, message: 'Not authenticated' });
        shopDB.all('SELECT c.*, p.name, p.price, p.image FROM cart c JOIN products p ON c.product_id = p.id WHERE c.user_email = ?', [user_email], (err, rows) => {
            if (err) return res.json({ success: false });
            res.json({ success: true, cart: rows });
        });
    });
});

app.delete('/api/cart', (req, res) => {
    const { user_email, product_id } = req.body;
    isRegisteredUser(user_email, (isValid) => {
        if (!isValid || !product_id) return res.json({ success: false, message: 'Not authenticated' });
        shopDB.run('DELETE FROM cart WHERE user_email = ? AND product_id = ?', [user_email, product_id], function(err) {
            if (err) return res.json({ success: false });
            res.json({ success: true });
        });
    });
});

// --- ORDER ENDPOINT ---
app.post('/api/order', (req, res) => {
    const { user_email } = req.body;
    isRegisteredUser(user_email, (isValid) => {
        if (!isValid) return res.json({ success: false, message: 'Not authenticated' });
        shopDB.serialize(() => {
            shopDB.run('INSERT INTO orders (user_email) VALUES (?)', [user_email], function(err) {
                if (err) return res.json({ success: false });
                const order_id = this.lastID;
                shopDB.all('SELECT * FROM cart WHERE user_email = ?', [user_email], (err, cartItems) => {
                    if (err) return res.json({ success: false });
                    const stmt = shopDB.prepare('INSERT INTO order_items (order_id, product_id, quantity) VALUES (?, ?, ?)');
                    cartItems.forEach(item => {
                        stmt.run(order_id, item.product_id, item.quantity);
                    });
                    stmt.finalize(() => {
                        shopDB.run('DELETE FROM cart WHERE user_email = ?', [user_email], () => {
                            res.json({ success: true });
                        });
                    });
                });
            });
        });
    });
});

// --- HISTORY ENDPOINT ---
app.get('/api/history', (req, res) => {
    const user_email = req.query.user_email;
    isRegisteredUser(user_email, (isValid) => {
        if (!isValid) return res.json({ success: false, message: 'Not authenticated' });
        shopDB.all('SELECT o.id as order_id, o.order_time, oi.product_id, oi.quantity, p.name, p.price, p.image FROM orders o JOIN order_items oi ON o.id = oi.order_id JOIN products p ON oi.product_id = p.id WHERE o.user_email = ? ORDER BY o.order_time DESC', [user_email], (err, rows) => {
            if (err) return res.json({ success: false });
            res.json({ success: true, history: rows });
        });
    });
});

// --- BUY MEMBERSHIP ENDPOINT ---
app.post('/api/membership/buy', (req, res) => {
    const { user_email, plan } = req.body;
    isRegisteredUser(user_email, (isValid) => {
        if (!isValid || !plan) return res.json({ success: false, message: 'Not authenticated' });
        let months = 1;
        if (plan === '6months') months = 6;
        if (plan === '1year') months = 12;
        const start = new Date();
        const end = new Date(start);
        end.setMonth(end.getMonth() + months);
        shopDB.run('INSERT INTO memberships (user_email, plan, start_date, end_date) VALUES (?, ?, ?, ?)', [user_email, plan, start.toISOString(), end.toISOString()], function(err) {
            if (err) return res.json({ success: false });
            res.json({ success: true });
        });
    });
});

// --- MEMBERSHIP HISTORY ENDPOINT ---
app.get('/api/membership/history', (req, res) => {
    const user_email = req.query.user_email;
    isRegisteredUser(user_email, (isValid) => {
        if (!isValid) return res.json({ success: false, message: 'Not authenticated' });
        shopDB.all('SELECT *, DATETIME(start_date) as start, DATETIME(end_date) as end FROM memberships WHERE user_email = ? ORDER BY start_date DESC', [user_email], (err, rows) => {
            if (err) return res.json({ success: false });
            const now = new Date();
            const history = rows.map(row => {
                const end = new Date(row.end);
                const status = end < now ? 'Expired' : 'Not Expired';
                const timeLeft = end < now ? 0 : Math.max(0, end - now);
                return { ...row, status, timeLeft };
            });
            res.json({ success: true, history });
        });
    });
});

// --- DEMO PRODUCTS ENDPOINT (for testing only) ---
app.get('/api/demo-products', (req, res) => {
    const demoProducts = [
        {
            name: 'Creatine Monohydrate',
            description: 'Micronized creatine powder for muscle growth, strength, and performance. 100 servings.',
            image: 'https://m.media-amazon.com/images/I/61auT4jdRQL._UF1000,1000_QL80_.jpg',
            price: 1399.00
        },
        {
            name: 'Whey Protein',
            description: 'High-quality whey protein for muscle recovery and building. 1kg, chocolate flavor.',
            image: 'https://m.media-amazon.com/images/I/71l2r6yqQ0L._AC_SL1500_.jpg',
            price: 2499.00
        },
        {
            name: 'BCAA Powder',
            description: 'Branched-chain amino acids for muscle recovery and endurance. 30 servings.',
            image: 'https://m.media-amazon.com/images/I/71QKQ9mwV7L._AC_SL1500_.jpg',
            price: 1199.00
        },
        {
            name: 'Electrol Hydration Drink',
            description: 'Electrolyte drink for instant hydration and energy during workouts.',
            image: 'https://m.media-amazon.com/images/I/61Q5p1QKQwL._AC_SL1000_.jpg',
            price: 299.00
        },
        {
            name: 'Gym Shaker Bottle',
            description: 'Leak-proof shaker bottle for protein shakes and supplements. 700ml.',
            image: 'https://m.media-amazon.com/images/I/61Q5p1QKQwL._AC_SL1000_.jpg',
            price: 349.00
        },
        {
            name: 'Gym Bag',
            description: 'Spacious and durable gym bag with shoe compartment and water-resistant material.',
            image: 'https://m.media-amazon.com/images/I/81Q5p1QKQwL._AC_SL1500_.jpg',
            price: 899.00
        },
        {
            name: 'Resistance Bands Set',
            description: 'Set of 5 resistance bands for strength training, stretching, and mobility.',
            image: 'https://m.media-amazon.com/images/I/71QKQ9mwV7L._AC_SL1500_.jpg',
            price: 499.00
        },
        {
            name: 'Yoga Mat',
            description: 'Non-slip yoga mat for workouts, pilates, and stretching. 6mm thick.',
            image: 'https://m.media-amazon.com/images/I/81Q5p1QKQwL._AC_SL1500_.jpg',
            price: 599.00
        }
    ];
    const stmt = shopDB.prepare('INSERT INTO products (name, description, image, price) VALUES (?, ?, ?, ?)');
    demoProducts.forEach(p => {
        stmt.run(p.name, p.description, p.image, p.price);
    });
    stmt.finalize(() => {
        res.json({ success: true, message: 'Demo products added.' });
    });
});

// Serve HTML files for direct navigation
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));
app.get('/login.html', (req, res) => res.sendFile(path.join(__dirname, 'login.html')));
app.get('/signup.html', (req, res) => res.sendFile(path.join(__dirname, 'signup.html')));
app.get('/workout.html', (req, res) => res.sendFile(path.join(__dirname, 'workout.html')));
app.get('/shop.html', (req, res) => {
    const userEmail = req.query.user_email;
    if (!userEmail || userEmail.trim() === '') {
        return res.redirect('/login.html');
    }
    res.sendFile(path.join(__dirname, 'shop.html'));
});

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`)); 
// index.js (Vercel Serverless Ready)

const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();

const app = express();

// Middleware
app.use(express.json());
app.use(cors());

// MongoDB connection details
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@ggbd.znymale.mongodb.net/?appName=ggbd`;
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

// Cache the database object to reuse the connection across invocations
// Vercel-এ কোল্ড স্টার্ট সমস্যা কমাতে এটি গুরুত্বপূর্ণ
let dbInstance = null;

// Function to get or establish MongoDB connection
async function getDb() {
    if (dbInstance) {
        return dbInstance;
    }
    // Connect only if needed (first invocation)
    await client.connect();
    dbInstance = client.db('shopnex_db');
    console.log("MongoDB connection established/reused.");
    return dbInstance;
}

// ----------------------------------------------------------------------
// API Routes
// ----------------------------------------------------------------------

// Root Route (Cannot GET / সমস্যা সমাধান)
app.get('/', (req, res) => {
    res.send('🚀 Shopnex Backend is Running on Vercel!');
});

// Add New Product
app.post('/products', async (req, res) => {
    try {
        const db = await getDb();
        const productsCollection = db.collection('products');
        const product = req.body;

        if (!product?.name || !product?.price || !product?.email) {
            return res.status(400).json({ error: "name, price & email required" });
        }

        const result = await productsCollection.insertOne(product);
        res.status(201).json({
            message: "Product Added Successfully",
            productId: result.insertedId
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// Get All Products
app.get('/products', async (req, res) => {
    try {
        const db = await getDb();
        const productsCollection = db.collection('products');
        const products = await productsCollection.find().toArray();
        res.status(200).json(products);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// Get Products for Logged-in User (by email)
app.get('/products/user/:email', async (req, res) => {
    try {
        const db = await getDb();
        const productsCollection = db.collection('products');
        const email = req.params.email;
        const products = await productsCollection.find({ email }).toArray();
        res.status(200).json(products);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// Get Single Product by ID
app.get('/products/:id', async (req, res) => {
    try {
        const db = await getDb();
        const productsCollection = db.collection('products');
        const id = req.params.id;
        const product = await productsCollection.findOne({ _id: new ObjectId(id) });
        if (!product) return res.status(404).json({ error: "Product Not Found" });
        res.status(200).json(product);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// Update/Edit Product
app.put('/products/:id', async (req, res) => {
    try {
        const db = await getDb();
        const productsCollection = db.collection('products');
        const id = req.params.id;
        const updatedData = req.body;

        const result = await productsCollection.updateOne(
            { _id: new ObjectId(id) },
            { $set: updatedData }
        );

        res.status(200).json({ message: "Product Updated", result });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// Delete Product
app.delete('/products/:id', async (req, res) => {
    try {
        const db = await getDb();
        const productsCollection = db.collection('products');
        const id = req.params.id;
        const email = req.query.email;

        const product = await productsCollection.findOne({ _id: new ObjectId(id) });
        if (!product) return res.status(404).json({ error: "Product Not Found" });

        if (product.email !== email) {
            return res.status(403).json({ error: "Unauthorized — You cannot delete this!" });
        }

        await productsCollection.deleteOne({ _id: new ObjectId(id) });
        res.status(200).json({ message: "Product Deleted Successfully" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Internal Server Error" });
    }
});


module.exports = app;
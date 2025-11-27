// index.js
const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 4000;

// Middleware
app.use(express.json());
app.use(cors());

// MongoDB connection
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@ggbd.znymale.mongodb.net/?appName=ggbd`;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    await client.connect();
    console.log(" MongoDB Connected Successfully!");

    const db = client.db('shopnex_db');
    const productsCollection = db.collection('products');

    //---------------------------------------------------
    // Root
    //---------------------------------------------------
    app.get('/', (req, res) => {
      res.send('🚀 Shopnex Backend is Running!');
    });

    //---------------------------------------------------
    // 1️⃣ Add New Product (with user email)
    //---------------------------------------------------
    app.post('/products', async (req, res) => {
      const product = req.body;

      if (!product?.name || !product?.price || !product?.email) {
        return res.status(400).json({ error: "name, price & email required" });
      }

      const result = await productsCollection.insertOne(product);
      res.status(201).send({
        message: "Product Added Successfully",
        productId: result.insertedId
      });
    });

    //---------------------------------------------------
    // 2️⃣ Get All Products
    //---------------------------------------------------
    app.get('/products', async (req, res) => {
      const products = await productsCollection.find().toArray();
      res.status(200).json(products);
    });

    //---------------------------------------------------
    // 3️⃣ Get Products Only For Login User by Email
    //---------------------------------------------------
    app.get('/products/user/:email', async (req, res) => {
      const email = req.params.email;
      const products = await productsCollection.find({ email }).toArray();
      res.status(200).json(products);
    });

    //---------------------------------------------------
    // 4️⃣ Get Single Product (View)
    //---------------------------------------------------
    app.get('/product/:id', async (req, res) => {
      const id = req.params.id;
      const product = await productsCollection.findOne({ _id: new ObjectId(id) });
      if (!product) return res.status(404).json({ error: "Product Not Found" });
      res.json(product);
    });

    //---------------------------------------------------
    // 5️⃣ Update/Edit Product
    //---------------------------------------------------
    app.put('/product/:id', async (req, res) => {
      const id = req.params.id;
      const updatedData = req.body;

      const result = await productsCollection.updateOne(
        { _id: new ObjectId(id) },
        { $set: updatedData }
      );

      res.send({ message: "Product Updated", result });
    });

    //---------------------------------------------------
    // 6️⃣ Delete Product (Secure — Only owner can delete)
    //---------------------------------------------------
    app.delete('/product/:id', async (req, res) => {
      const id = req.params.id;
      const email = req.query.email; // must send like => /product/id?email=user@gmail.com

      const product = await productsCollection.findOne({ _id: new ObjectId(id) });
      if (!product) return res.status(404).send({ error: "Product not found" });

      if (product.email !== email) {
        return res.status(403).send({ error: "Unauthorized — You cannot delete this!" });
      }

      await productsCollection.deleteOne({ _id: new ObjectId(id) });
      res.send({ message: "Product Deleted Successfully" });
    });

  } catch (err) {
    console.error(err);
  }
}

run().catch(console.dir);

// Start Server
app.listen(port, () => console.log(` Server running on port ${port}`));

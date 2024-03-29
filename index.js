const express = require('express')
const app = express()
const cors = require('cors')
var jwt = require('jsonwebtoken');
require('dotenv').config()
const { ObjectId } = require('mongodb');
const port = process.env.PORT || 5000;


// middleware 
app.use(cors());
app.use(express.json())


const { MongoClient, ServerApiVersion } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.vsna1uo.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

async function run() {
    try {
        // Connect the client to the server	(optional starting in v4.7)
        // await client.connect();

        const userCollection = client.db("vbdLakshmipurDB").collection("users")


        // jwt related API

        app.post('/jwt', async (req, res) => {
            const user = req.body;
            const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
                expiresIn: '1h'
            })
            res.send({ token })
        })





        //middleWare
        const verifyToken = (req, res, next) => {
            // console.log('Inside verify token:', req.headers.authorization);
            if (!req.headers.authorization) {
                return res.status(401).send({ message: 'unauthorized access' })
            }
            const token = req.headers.authorization.split(' ')[1];
            jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
                if (err) {
                    return res.status(401).send({ message: ' unauthorized access' })
                }
                req.decoded = decoded;
                next()
            })
        }



        //use verifyAdmin after VerifyToken

        const verifyAdmin = async (req, res, next) => {
            const email = req.decoded.email;
            const query = { email: email };
            const user = await userCollection.findOne(query);
            const isAdmin = user.role === 'admin';
            if (!isAdmin) {
                return res.status(403).send({ message: 'forbidden access' })
            }
            next()
        }



        // user related API 

        app.get('/users', verifyToken, async (req, res) => {
            const search = req.query.search;

            const query = {};
            if (search) {
                query.name = { $regex: new RegExp(search, "i") };
            }

            const result = await userCollection
                .aggregate([
                    { $match: query }
                ])
                .toArray();
            res.send(result);

        })


        app.get('/user/currentUser', async (req, res) => {
            const email = req.query.email;
            const query = { email: email };
            const result = await userCollection.find(query).toArray();
            res.send(result);

        });




        app.post('/users', async (req, res) => {
            const user = req.body;
            const query = { email: user.email }
            const existingUser = await userCollection.findOne(query);
            if (existingUser) {
                return res.send({ message: 'user already exists', insertedId: null })
            }
            const result = await userCollection.insertOne(user);
            res.send(result);
        })








        // Send a ping to confirm a successful connection
        // await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);










app.get('/', (req, res) => {
    res.send('VBD - Lakshmipur is running')
})

app.listen(port, () => {
    console.log(`VBD - Lakshmipur is running on port ${port}`)
})
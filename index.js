const express = require('express')
const cors = require('cors')
const jwt = require('jsonwebtoken')
const cookie = require('cookie-parser')
require('dotenv').config()
const app = express()
const port = process.env.PORT || 3000

const corsOptions = {
  origin: ['http://localhost:5173', 'https://career-cove.netlify.app'],
  credentials: true,
  optionSuccessStatus: 200,
}

app.use(cors(corsOptions))
app.use(express.json())



const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.x6ipdw6.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

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

    const jobsCollection = client.db("jobSeeking").collection("jobs");
    const applyingJobsCollection = client.db("jobSeeking").collection("applyingJobs");
    const customerReview = client.db("jobSeeking").collection("Customer Review");


    // jwt generate

    app.post('/jwts', async (req, res) => {
      const user = req.body
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: '7d'
      })
      res.cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict'
      })
        .send({ success: true })

    })
    app.get('/jobs', async (req, res) => {

      const cursor = jobsCollection.find();

      const result = await cursor.toArray();
      res.send(result)
    })

    app.get('/jobs/:id', async (req, res) => {

      const id = req.params.id;
      const query = { _id: new ObjectId(id) }

      const cursor = await jobsCollection.findOne(query);

      const result = cursor;
      res.send(result)
    })

    app.get("/job/:email", async (req, res) => {
      const email = req.params.email
      const query = { buyer_email: email }
      const result = await jobsCollection.find(query).toArray()
      res.send(result)
    })

    app.get("/applying-job/:email", async (req, res) => {
      const email = req.params.email
      const query = { 'applicantEmail': email }
      const result = await applyingJobsCollection.find(query).toArray()
      res.send(result)
    })

    app.get("/job-request/:email", async (req, res) => {
      const email = req.params.email
      const query = { 'buyer_email': email }
      const result = await applyingJobsCollection.find(query).toArray()
      res.send(result)
    })

    app.get("/customerReview", async (req, res) => {
      const cursor = customerReview.find();
      const result = await cursor.toArray();
      res.send(result);
    })

    app.patch("/updateStatus/:id", async (req, res) => {
      const id = req.params.id
      const status = req.body
      const query = { _id: new ObjectId(id) }
      const updateDoc = {
        $set: status,
      }
      const result = await applyingJobsCollection.updateOne(query, updateDoc)
      res.send(result)
    })

    app.post('/applying-jobs', async (req, res) => {
      const applyingJob = req.body
      const result = await applyingJobsCollection.insertOne(applyingJob)
      res.send(result)
    })

    //   app.post('/apply/:jobTitle', async (req, res) => {
    //     const { jobTitle } = req.params;

    //         // Update the job document to increment the applicants number
    //         const result = await jobsCollection.updateOne(
    //             { job_title: jobTitle }, // Specify the job by its job_title
    //             { $inc: { applicants_number: 1 } } // Increment applicants number by 1
    //         );
    //         res.send(result)
    // });



    app.post('/jobs', async (req, res) => {
      const jobs = req.body
      const result = await jobsCollection.insertOne(jobs)
      res.send(result)
    })

    app.delete("/job/:id", async (req, res) => {
      const id = req.params.id
      const query = { _id: new ObjectId(id) }
      const result = await jobsCollection.deleteOne(query)
      res.send(result)
    })

    app.put('/jobs/:id', async (req, res) => {
      const id = req.params.id
      const jobData = req.body
      const query = { _id: new ObjectId(id) }
      const options = { upsert: true }
      const updateDoc = {
        $set: {
          ...jobData,
        },
      }

      const result = await jobsCollection.updateOne(query, updateDoc, options)
      res.send(result)
    })

    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);


app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})

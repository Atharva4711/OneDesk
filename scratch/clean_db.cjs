const { MongoClient } = require("mongodb");

const MONGO_URL = "mongodb+srv://atharvateli4711_db_user:psH9WfWq8E1YbksG@usersdb.hzybrfu.mongodb.net/?retryWrites=true&w=majority";
const DB_NAME = "auracampus";

async function cleanDb() {
  console.log("Connecting to MongoDB Atlas...");
  const client = new MongoClient(MONGO_URL);
  await client.connect();
  const db = client.db(DB_NAME);

  console.log("Connected! Inspecting users collection...");
  const users = await db.collection("users").find({}).toArray();
  console.log(`Found ${users.length} users in database:`);
  users.forEach(u => console.log(` - ID: ${u.id}, Email: ${u.email}, Role: ${u.role}, Enrollment: ${u.enrollment_number}`));

  // Remove any duplicate AC2025001 users
  const acUsers = await db.collection("users").find({ enrollment_number: "AC2025001" }).toArray();
  if (acUsers.length > 1) {
    console.log(`Found ${acUsers.length} duplicate AC2025001 users. Cleaning duplicates...`);
    for (let i = 1; i < acUsers.length; i++) {
      await db.collection("users").deleteOne({ _id: acUsers[i]._id });
      console.log(`Deleted duplicate user: ${acUsers[i].email}`);
    }
  }

  // Ensure student@onedesk.com has AC2025001
  await db.collection("users").deleteMany({ email: { $in: ["student@auracampus.com", "teacher@auracampus.com", "admin@auracampus.com"] } });
  console.log("Cleaned old auracampus seed users from Mongo Atlas.");

  await client.close();
  console.log("Database cleanup complete!");
}

cleanDb().catch(console.error);

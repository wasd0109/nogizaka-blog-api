import * as functions from "firebase-functions";
import * as express from "express";
import { scrapeMemberList } from "./scraping/members";
import { db } from "./utils/fbInit";
import { scrapeMemberBlogs } from "./scraping/blogs";

const app = express();

// Start writing Firebase Functions
// https://firebase.google.com/docs/functions/typescript

app.post("/refreshMembers", async (req, res) => {
  try {
    const result = await scrapeMemberList();
    return res.status(200).send(result);
  } catch (err) {
    return res.status(500).send(err);
  }
});

app.get("/members", async (req, res) => {
  try {
    const snapshot = await db.collection("members").get();
    const list = await snapshot.docs.map((doc) => doc.data());
    res.status(200).send(list);
  } catch (err) {
    res.status(500).send(err);
  }
});

app.post("/refreshBlogs", async (req, res) => {
  const id = req.query["member"] as string;
  if (!id) res.status(400).send("ID must not be empty");
  try {
    const result = await scrapeMemberBlogs(id);
    res.status(200).send(result);
  } catch (err) {
    res.status(400).send(err);
  }
});

exports.api = functions
  .runWith({ timeoutSeconds: 300, memory: "2GB" })
  .https.onRequest(app);

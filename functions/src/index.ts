import * as functions from "firebase-functions";
import * as express from "express";
import { scrapeMemberList } from "./scraping/members";
import { db } from "./utils/fbInit";
import { scrapeAllMemberBlogs } from "./scraping/blogs";

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

app.post("/refreshBlogs", scrapeAllMemberBlogs);

exports.api = functions.https.onRequest(app);

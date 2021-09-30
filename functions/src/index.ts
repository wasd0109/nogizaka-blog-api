import * as functions from "firebase-functions";
import * as express from "express";
import { getMemberList } from "./scrape";
import * as admin from "firebase-admin";

const app = express();
export const db = admin.initializeApp().firestore();
// Start writing Firebase Functions
// https://firebase.google.com/docs/functions/typescript

app.get("/refreshMembers", async (req, res) => {
  try {
    await getMemberList();
    return res.status(200).send("OK");
  } catch (err) {
    console.log(err);
    return res.status(500).send("Error");
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

exports.api = functions.https.onRequest(app);

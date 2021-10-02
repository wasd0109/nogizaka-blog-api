import * as functions from "firebase-functions";
import * as express from "express";
import { MemberInfo, scrapeMemberList } from "./scraping/members";
import { db } from "./utils/fbInit";
import { scrapeMemberBlogs } from "./scraping/blogs";
import { paginateArray } from "./utils/tools";

const app = express();

// Start writing Firebase Functions
// https://firebase.google.com/docs/functions/typescript

app.post("/members", async (req, res) => {
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

app.post("/blogs", async (req, res) => {
  const id = req.query["id"] as string;
  const href = req.query["href"] as string;
  if (!id && !href) res.status(400).send("ID must not be empty");
  try {
    const result = await scrapeMemberBlogs(href);
    res.status(200).send(result);
  } catch (err) {
    res.status(400).send(err);
  }
});

app.get("/blogs", async (req, res) => {
  const href = req.query["href"] as string;
  const page = (req.query["page"] as string) || "1";
  const itemCount = (req.query["count"] as string) || "20";
  if (href) {
    const mb = (await (
      await db.collection("members").where("href", "==", href).get()
    ).docs[0].data()) as MemberInfo;
    console.log(mb);
    const docs = await (
      await db.collection("blogs").where("author", "==", mb.name).get()
    ).docs;
    const paginatedDocs = paginateArray(
        docs,
        parseInt(itemCount),
        parseInt(page)
    );
    const blogs = paginatedDocs.map((doc) => doc.data());
    res.send({
      blogs,
      length: blogs.length,
    });
  }
});

exports.api = functions
    .runWith({ timeoutSeconds: 300, memory: "2GB" })
    .https.onRequest(app);

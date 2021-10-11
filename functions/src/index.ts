import * as functions from "firebase-functions";
import * as express from "express";
import { scrapeMemberList } from "./scraping/members";
import { db } from "./utils/fbInit";
import {
  scrapeBlogs,
  scrapeMemberBlogs,
  scrapeNewBlogs,
} from "./scraping/blogs";
import { Blog } from "./models/Blogs";

import { PubSub } from "@google-cloud/pubsub";
import { MemberInfo } from "./models/Members";

const pubsub = new PubSub();
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
  const href = req.query["href"] as string;
  if (!href) {
    console.log("run");
    const mbDocs = await (await db.collection("members").get()).docs;
    const mbList = mbDocs.map((doc) => doc.data() as MemberInfo);
    for (const mb of mbList) {
      if (mb.accessible) await scrapeBlogs(mb);
      else console.log(`${mb.name} skipped`);
    }
    res.status(200).send("Success");
  } else {
    try {
      const result = await scrapeMemberBlogs(href);
      res.status(200).send(result);
    } catch (err) {
      res.status(400).send(err);
    }
  }
});

app.get("/blogs", async (req, res) => {
  const href = req.query["href"] as string;
  const page = (req.query["page"] as string) || "1";
  const itemCount = (req.query["count"] as string) || "20";
  const previewLength = (req.query["previewLength"] as string) || "300";
  const pageNumber = parseInt(page);
  const pageSize = parseInt(itemCount);
  const offset = (pageNumber - 1) * pageSize;
  if (href) {
    const mb = (await (
      await db.collection("members").where("href", "==", href).get()
    ).docs[0].data()) as MemberInfo;

    const docs = await (
      await db
        .collection("blogs")
        .where("author", "==", mb.name)
        .orderBy("timestamp", "desc")
        .offset(offset)
        .limit(20)
        .get()
    ).docs;
    // const paginatedDocs = paginateArray(docs, pageSize, pageNumber);
    const blogs = docs.map((doc) => {
      const blog = doc.data() as Blog;

      if (previewLength == "true") return blog;
      return {
        ...blog,
        content: blog.content.substring(0, parseInt(previewLength)),
      };
    });
    res.send({
      blogs,
      length: blogs.length,
    });
  } else {
    const docs = await (
      await db
        .collection("blogs")

        .orderBy("timestamp", "desc")
        .offset(offset)
        .limit(20)
        .get()
    ).docs;

    const blogs = docs.map((doc) => {
      const blog = doc.data() as Blog;

      if (previewLength == "true") return blog;
      return {
        ...blog,
        content: blog.content.substring(0, parseInt(previewLength)),
      };
    });

    res.send({
      blogs,
      length: blogs.length,
    });
  }
});

exports.api = functions
  .region("asia-northeast2")
  .runWith({ timeoutSeconds: 540, memory: "2GB" })
  .https.onRequest(app);

exports.scheduledFunction = functions
  .region("asia-northeast2")
  .runWith({ timeoutSeconds: 540, memory: "2GB" })
  .pubsub.schedule("every 30 minutes")
  .onRun(async () => {
    console.log("Scheduled run");

    const mbDocs = await (await db.collection("members").get()).docs;
    const mbList = mbDocs.map((doc) => doc.data() as MemberInfo);
    for (const mb of mbList) {
      if (mb.accessible) await scrapeNewBlogs(mb);
      else console.log(`${mb.name} skipped`);
    }
    return null;
  });

// exports.scheduledFunction = functions
//   .region("asia-northeast2")
//   .runWith({ timeoutSeconds: 300, memory: "2GB" })
//   .pubsub.schedule("every 5 seconds")
//   .onRun(async () => {
//     console.log("Scheduled run");
//     return null;
//   });

exports.pubsubWriter = functions
  .region("asia-northeast2")
  .https.onRequest(async (req, res) => {
    console.log("Pubsub Emulator:", process.env.PUBSUB_EMULATOR_HOST);
    const testTopic =
      "projects/nogizaka-api-98c03/topics/firebase-schedule-scheduledFunction";
    const msg = await pubsub.topic(testTopic).publishJSON(
      {
        foo: "bar",
        date: new Date(),
      },
      { attr1: "value" }
    );

    res.json({
      published: msg,
    });
  });

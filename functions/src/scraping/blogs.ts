import * as cheerio from "cheerio";
import { api } from "../api/axios";
import { db } from "../utils/fbInit";
import { MemberInfo } from "./members";
import axios from "axios";
import { Blog } from "../models/Blogs";
import { NodeHtmlMarkdown } from "node-html-markdown";
import * as getUuid from "uuid-by-string";
import { findArrayDifference } from "../utils/tools";

type ScrapeMemberBlogsResult = Promise<{
  updated: boolean;
  result: FirebaseFirestore.WriteResult[] | [];
}>;
export const scrapeMemberBlogs = async (
    href: string
): ScrapeMemberBlogsResult => {
  const mbList: MemberInfo[] = await (
    await db.collection("members").get()
  ).docs.map((doc) => doc.data() as MemberInfo);

  const mb = mbList.filter((mb) => mb.href == href)[0];
  if (mb) {
    return await scrapeBlogs(mb);
  } else throw Error("Invalid ID");
};

const scrapeBlogs = async (mb: MemberInfo): ScrapeMemberBlogsResult => {
  const monthList = await getMonthUrl(mb);
  const blogUrls = await (await getAllBlogUrl(monthList)).flat();
  const urlRef = await db.collection("urls").doc(mb.id);
  const urlDoc = await urlRef.get();
  const dbUrls = urlDoc.data()?.value || [];
  const diff = findArrayDifference(blogUrls, dbUrls) as string[];

  // const diff = findArrayDifference(blogs, dbBlogs);
  const diffLength = diff.length;
  if (diffLength) {
    let blogs;
    if (diffLength > 300) {
      const half = Math.ceil(diffLength / 2);
      const firstHalf = diff.slice(0, half);
      const secondHalf = diff.slice(-half);
      const firstHalfBlog = await getAllBlogs(firstHalf);
      const secondHalfBlog = await getAllBlogs(secondHalf);
      await urlRef.set({ value: blogUrls });
      blogs = [...firstHalfBlog, ...secondHalfBlog];
    } else blogs = await getAllBlogs(diff);
    // const dbBlogsRef = await db
    //   .collection("blogs")
    //   .where("author", "==", mb.name)
    //   .get();
    // const dbBlogs = dbBlogsRef.docs.map((doc) => {
    //   const blog = doc.data();
    //   return { ...blog, timestamp: blog.timestamp.toDate() } as Blog;
    // });
    const result = await saveBlogs(blogs);
    return { updated: true, result };
  } else return { updated: false, result: [] };
};

const saveBlogs = (blogs: Blog[]) => {
  const collectionRef = db.collection("blogs");
  const promiseArray: Promise<FirebaseFirestore.WriteResult>[] = [];
  blogs.forEach(async (blog) => {
    const docRef = await collectionRef.doc(blog.id).get();
    if (!docRef.exists) {
      promiseArray.push(collectionRef.doc(blog.id).set(blog));
      console.log(`Save blog ${blog.title} by ${blog.author}`);
    }
  });
  return Promise.all(promiseArray);
};

const getMonthUrl = async (mb: MemberInfo) => {
  const res = await api.get(`/${mb.href}`);
  const $ = cheerio.load(res.data);
  const months = $("option");
  const monthList: string[] = [];
  months.each((i, el) => {
    const url = $(el).attr("value");
    if (url) monthList.push(url);
  });
  return monthList;
};

const getBlogUrl = async (monthUrl: string) => {
  const res = await axios.get(monthUrl);
  const $ = cheerio.load(res.data);
  const result: string[] = [];
  $("#daytable a").each((i, el) => {
    const url = $(el).attr("href");
    if (url) result.push(url);
  });
  return result;
};

const scrapeBlogFromUrl = async (url: string) => {
  const res = await axios(url);
  const $ = cheerio.load(res.data);
  const author = $($(".author")[0]).text();
  const title = $(".entrytitle").text();
  const content = NodeHtmlMarkdown.translate($(".entrybody").html() || "");
  const metadata = $(".entrybottom").text();
  // TODO Change code to reflect timestamp originated from JST
  const timestamp = new Date(metadata.split("｜")[0]);

  const blog: Blog = {
    author,
    title,
    content,
    timestamp,
    id: getUuid(`${author}-${timestamp}`),
  };

  return blog;
};

// const getAllMonthUrl = (mbList: MemberInfo[]) => {
//   const promiseArray: Promise<string[]>[] = [];
//   mbList.forEach((mb) => promiseArray.push(getMonthUrl(mb)));
//   return Promise.all(promiseArray);
// };

const getAllBlogUrl = (monthUrlList: string[]) => {
  const promiseArray: Promise<string[]>[] = [];
  monthUrlList.forEach((url) => {
    promiseArray.push(getBlogUrl(url));
  });

  return Promise.all(promiseArray);
};

const getAllBlogs = (urls: string[]) => {
  const promiseArray: Promise<Blog>[] = [];
  urls.forEach((url) => promiseArray.push(scrapeBlogFromUrl(url)));
  return Promise.all(promiseArray);
};

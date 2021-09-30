import * as cheerio from "cheerio";
import { api } from "../api/axios";
import { db } from "../utils/fbInit";
import { MemberInfo } from "./members";
import axios from "axios";
import { Blog } from "../models/Blogs";

export const scrapeAllMemberBlogs = async (req, res) => {
  const mbList: MemberInfo[] = await (
    await db.collection("members").get()
  ).docs.map((doc) => doc.data() as MemberInfo);

  const monthUrls = await getAllMemberMonthUrl(mbList.slice(0, 1));
  const flattenMonthUrls = monthUrls.flat();
  const blogUrls = await getAllMemberBlogUrl(flattenMonthUrls.slice(0, 5));
  const flattenBlogUrls = blogUrls.flat();
  const blogs = await getAllBlogs(flattenBlogUrls);
  blogs.forEach(
    async (blog) =>
      await db
        .collection("blogs")
        .doc(`${blog.author}-${blog.title}-${blog.timestamp}`)
        .set(blog)
  );
  res.send("OK");
};

const getMonthUrl = async (mb: MemberInfo) => {
  const res = await api.get(`/${mb.href}`);
  const $ = cheerio.load(res.data);
  const months = $("option");
  let monthList: string[] = [];
  months.each((i, el) => {
    const url = $(el).attr("value");
    if (url) monthList.push(url);
  });
  return monthList;
};

const getBlogUrl = async (monthUrl: string) => {
  const res = await axios.get(monthUrl);
  const $ = cheerio.load(res.data);
  let result: string[] = [];
  $("#sidecalendar a").each((i, el) => {
    const url = $(el).attr("href");
    if (url) result.push(url);
  });
  return result;
};

const scrapeBlogFromUrl = async (url: string) => {
  const res = await axios(url);
  const $ = cheerio.load(res.data);
  const author = $($(".author")[0]).text();
  console.log($(".author").text());
  const title = $(".entrytitle").text();
  const content = $(".entrybody").html() || "";
  const metadata = $(".entrybottom").text();
  // TODO Change code to reflect timestamp originated from JST
  const timestamp = new Date(metadata.split("｜")[0]);

  const blog: Blog = {
    author,
    title,
    content,
    timestamp,
  };

  return blog;
};

const getAllMemberMonthUrl = (mbList: MemberInfo[]) => {
  const promiseArray: Promise<string[]>[] = [];
  mbList.forEach((mb) => promiseArray.push(getMonthUrl(mb)));
  return Promise.all(promiseArray);
};

const getAllMemberBlogUrl = (monthUrlList: string[]) => {
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

// const saveAllBlogs = (blogs: Blog[]) => {
//   const promiseArray: Promise<>[] = [];
//   blogs.forEach((blog) =>
//     db.collection("blogs").doc(`${blog.author}-${blog.title}-${blog.timestamp}`).set()
//   );
// };

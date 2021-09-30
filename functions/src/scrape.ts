import * as axios from "axios";
import * as cheerio from "cheerio";
import { db } from ".";

type MemberInfo = {
  name: string;
  href: string | null;
};

const api = axios.default;

export const getMemberList = () => {
  return api.get("https://blog.nogizaka46.com").then((res) => {
    const $ = cheerio.load(res.data);
    const mbListElement = $("#sidemember div a");
    let mbList: MemberInfo[] = [];
    mbListElement.each((i, e) => {
      const element = $(e);
      const member: MemberInfo = {
        name:
          $($(".kanji")[i]).text().replace(" ", "") ||
          element.text().replace(">>", ""),
        href: element.attr("href")?.replace("./", "") || null,
      };
      mbList.push(member);
    });
    mbList.forEach(async (mb) => {
      db.collection("members").doc(mb.name).set(mb);
    });
  });
};

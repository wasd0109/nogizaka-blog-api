import * as axios from "axios";
import * as cheerio from "cheerio";
import { db } from ".";
import { membersToCacheString } from "./utils";

export type MemberInfo = {
  name: string;
  href: string | null;
};

const api = axios.default;

export const getMemberList = async () => {
  const res = await api.get("https://blog.nogizaka46.com");
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
  const cachedString =
    (await (await db.collection("caches").doc("members").get()).data())
      ?.value || "";
  const cache = membersToCacheString(mbList);
  if (cachedString == cache) {
    console.log("no refresh");
    return;
  } else {
    mbList.forEach(async (mb) => {
      db.collection("members").doc(mb.name).set(mb);
    });

    db.collection("caches").doc("members").set({ value: cache });
  }
};

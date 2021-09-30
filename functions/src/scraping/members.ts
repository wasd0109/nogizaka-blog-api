import * as cheerio from "cheerio";
import { api } from "../api/axios";
import { db } from "../utils/fbInit";

export type MemberInfo = {
  name: string;
  href: string | null;
};

export const scrapeMemberList = async () => {
  const res = await api.get("/");
  const $ = cheerio.load(res.data);
  const mbListElement = $("#sidemember div a");
  const mbList: MemberInfo[] = [];
  mbListElement.each((i, el) => {
    const element = $(el);
    const member: MemberInfo = {
      name:
        $($(".kanji")[i]).text().replace(" ", "") ||
        element.text().replace(">>", ""),
      href: element.attr("href")?.replace("./", "") || null,
    };
    mbList.push(member);
  });
  const cacheDoc = await db.collection("caches").doc("members").get();
  const cachedString = (await cacheDoc.data()?.value) || "";
  const cache = membersToCacheString(mbList);

  // Prevent multiple write to database
  if (cachedString == cache) {
    return "Not refreshed";
  } else {
    mbList.forEach(async (mb) => {
      await db.collection("members").doc(mb.name).set(mb);
    });
    await db.collection("caches").doc("members").set({ value: cache });
    return "Refreshed";
  }
};

const membersToCacheString = (mbList: MemberInfo[]) => {
  return mbList.reduce((acc, mb) => `${acc}${mb.name}-${mb.href} `, "");
};

// const cacheStringToMember = (cachedString: string): MemberInfo[] => {
//   const list = cachedString.split(" ");
//   return list.map((mbString) => {
//     const mbInfo = mbString.split("-");
//     const mb: MemberInfo = {
//       name: mbInfo[0],
//       href: mbInfo[1],
//     };
//     return mb;
//   });
// };

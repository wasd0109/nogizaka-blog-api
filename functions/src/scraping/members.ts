import * as cheerio from "cheerio";
import { api } from "../api/axios";
import { db } from "../utils/fbInit";
import * as getUuid from "uuid-by-string";
import { findArrayDifference, isArrayEqual } from "../utils/tools";

export type MemberInfo = {
  name: string;
  href: string;
  id: string;
  accessible: boolean;
};

export const scrapeMemberList = async (): Promise<string> => {
  const res = await api.get("/");
  const $ = cheerio.load(res.data);
  const mbListElement = $("#sidemember div a");
  const mbList: MemberInfo[] = [];
  mbListElement.each((i, el) => {
    const element = $(el);
    const name =
      $($(".kanji")[i]).text().replace(" ", "") ||
      element.text().replace(">>", "").replace("ブログ", "");
    const href = element.attr("href")?.replace("./", "") || "";
    const member: MemberInfo = {
      name,
      href,
      id: getUuid(`${name}-${href}`),
      accessible: true,
    };
    mbList.push(member);
  });
  // TODO Find diff between new and old list -> set only new member
  // TODO Find diff between old and new list -> set deleted member accessible to false
  const cache = await db.collection("members").get();
  const cachedMember = cache.docs.map((doc) => doc.data() as MemberInfo);
  if (isArrayEqual(mbList, cachedMember)) {
    console.log(mbList.length, cachedMember.length);
    return "Not refreshed";
  } else {
    const newMember = findArrayDifference(mbList, cachedMember);
    const deletedMember = findArrayDifference(cachedMember, mbList);
    newMember.forEach(async (mb) => {
      await db.collection("members").doc(mb.id).set(mb);
    });
    deletedMember.forEach(async (mb) => {
      await db
        .collection("members")
        .doc(mb.id)
        .set({ ...mb, accessible: false });
    });
    return "Refreshed";
  }
};

// const membersToCacheString = (mbList: MemberInfo[]) => {
//   return mbList.reduce((acc, mb) => `${acc}${mb.name}-${mb.href} `, "");
// };

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

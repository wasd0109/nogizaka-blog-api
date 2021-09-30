import { MemberInfo } from "./scrape";

export const membersToCacheString = (mbList: MemberInfo[]) => {
  return mbList.reduce((acc, mb) => `${acc}${mb.name}-${mb.href} `, "");
};

export declare type MemberInfo = {
    name: string;
    href: string | null;
};
export declare const scrapeMemberList: () => Promise<"Not refreshed" | "Refreshed">;

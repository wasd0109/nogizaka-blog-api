import * as _ from "lodash";

export const sortByAlphabeticalOrder = (a: string, b: string): number => {
  if (a < b) {
    return -1;
  }
  if (a > b) {
    return 1;
  }
  return 0;
};

// eslint-disable-next-line
export const isArrayEqual = (x: any[], y: any[]): boolean =>
  _(x).differenceWith(y, _.isEqual).isEmpty() &&
  _(y).differenceWith(x, _.isEqual).isEmpty();

// eslint-disable-next-line
export const findArrayDifference = (x: any[], y: any[]) => {
  // eslint-disable-next-line
  return _.toArray(_(x).differenceWith(y, _.isEqual)) as any[];
};
// eslint-disable-next-line
export const paginateArray = (
  // eslint-disable-next-line
  array: any[],
  pageSize: number,
  pageNumber: number
  // eslint-disable-next-line
): any[] => {
  return array.slice((pageNumber - 1) * pageSize, pageNumber * pageSize);
};

// export const sleep = (milliseconds: number) => {
//   return new Promise((resolve) => setTimeout(resolve, milliseconds));
// };

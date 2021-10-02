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
  _(x).differenceWith(y, _.isEqual).isEmpty();

// eslint-disable-next-line
export const findArrayDifference = (x: any[], y: any[]) => {
  return _.toArray(_(x).differenceWith(y, _.isEqual));
};

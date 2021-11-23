import { ColumnSettings, DateColumn, DateTimeColumn, Filter, StringColumn } from "@remult/core";
import { OrderStatus } from "../core/order/order";
import { rootParams } from "../core/params/root-params/rootParams";
import { addDays } from "./utils";


export const TODAY: number = 0;
export const IsDevMode: boolean = true;
export const STARTING_ORDER_NUM: number = 1000;
export const WIDTH_COLUMN_SHORT_PLUS: string = '175';
export const WIDTH_COLUMN_SHORT: string = '150';
export const WIDTH_COLUMN_SHORT_MINUS: string = '80';
export const FILTER_IGNORE: Filter = new Filter(x => { return true; });

export const sharedParams = new rootParams({ date: addDays() });

export class changeDate extends DateTimeColumn {
  readonly = true;
}
export class TimeColumn extends StringColumn {
  static readonly Empty: string = '00:00';
  constructor(options?: ColumnSettings<string>) {
    super({
      inputType: 'time',
      defaultValue: TimeColumn.Empty,
      ...options
    });
  }
  isEmpty() {
    return !this.value || this.value.length === 0 || this.value === TimeColumn.Empty;
  }
}

// export class DateColumnEx extends DateColumn {
//   constructor(options?: ColumnSettings<Date>) {
//     super({
//       ...options
//     });
//   }
// }

export interface paramOptions {
  date?: Date
}

export interface MagicGetOrders {
  id: string,
  magicId: string,
  orderNum: number,
  fdate: Date,
  tdate: Date,
  status: OrderStatus
}
export interface MagicGetProducts {
  id: string,
  main: string,
  sub: string,
  sku: string
}
export interface MagicGetCategories {
  id: string
}
export interface MagicGetCategoriesResponse {
  id: string,
  name: string
}
export interface MagicGetCategoriesItems {
  id: string,
  categoryid: string
}
export interface MagicGetCategoriesItemsResponse {
  id: string,
  categoryid: string,
  name: string
}
export interface MagicGetProductsResponse {
  id: string,
  name: string,
  main: string,
  sub: string,
  sku: string
}


export interface MagicGetContainersItems {
  id: string,
  containerid: string,
  productid: string
}
export interface MagicGetContainersItemsResponse {
  id: string,
  containerId: string,
  productid: string,
  quantity: number
}
export interface MagicGetStoresResponse {
  id: string,
  name: string
}

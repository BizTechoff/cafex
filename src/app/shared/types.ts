import { DateTimeColumn } from "@remult/core";
import { rootParams } from "../core/params/root-params/rootParams";
import { addDays } from "./utils";

export const TODAY:number = 0;
export const IsDevMode:boolean = true;
export const STARTING_ORDER_NUM:number = 1000;

export const sharedParams = new rootParams({ date: addDays(TODAY) });

export class changeDate extends DateTimeColumn {
  readonly = true;
}

export interface paramOptions{
  date?:Date
}
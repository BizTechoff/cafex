import { Context, DateColumn, ServerController, ServerMethod } from "@remult/core";
import { paramOptions, TODAY } from "../../../shared/types";
import { addDays } from "../../../shared/utils";

@ServerController({ key: 'p/root', allowed: true })
export class rootParams {

  options: paramOptions = { date: addDays() };

  onChanged = async () : Promise<void> => { };
  date = new DateColumn({
    defaultValue: this.options.date ? this.options.date : addDays(),
    valueChange: async () => { await this.onChanged(); }
  });

  constructor(options?: paramOptions, onChanged?: () => Promise<void>, private context?: Context) {
    if (onChanged) {
      this.onChanged = onChanged;
    }
    if (options) {
      this.options = options;
    }
  }

  locAreas: { id: string, name: string, isBorder: boolean, area: string[] }[] = [];
  @ServerMethod()
  async retrieve() {
    if (this.context) {

    }
  }
}

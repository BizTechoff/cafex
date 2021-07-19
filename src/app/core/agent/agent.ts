import { EntityClass, IdEntity, NumberColumn, StringColumn } from "@remult/core";

@EntityClass
export class Agent extends IdEntity {
    name = new StringColumn({caption: 'שם'});
    code = new NumberColumn({caption: 'קוד'});
    constructor() {
        super({
            name: 'agents'
        });
    }
}
 
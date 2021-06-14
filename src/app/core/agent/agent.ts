import { EntityClass, IdEntity, NumberColumn, StringColumn } from "@remult/core";

@EntityClass
export class Agent extends IdEntity {
    name = new StringColumn();
    code = new NumberColumn();
    constructor() {
        super({
            name: 'agents'
        });
    }
}

import { Context, EntityClass, IdEntity, NumberColumn, StringColumn } from "@remult/core";
import { ProductIdColumn } from "../product/product";

@EntityClass
export class ContainerItem extends IdEntity {

    conid = new StringColumn({ caption: 'מחסן' });
    pid = new ProductIdColumn(this.context, { caption: "פריט" });
    quntity = new NumberColumn({ caption: "כמות" });

    constructor(private context: Context) {
        super({
            name: 'containersItems',
            allowApiCRUD: true,
            allowApiRead: c => c.isSignedIn()
        });
    }
}

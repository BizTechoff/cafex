import { Context, EntityClass, IdEntity, NumberColumn, StringColumn } from "@remult/core";
import { StoreIdColumn } from "../store/store";

@EntityClass
export class Product extends IdEntity {
    sid = new StoreIdColumn(this.context);
    name = new StringColumn();
    quntity = new NumberColumn();
    price = new NumberColumn({ decimalDigits: 2 });

    constructor(private context: Context) {
        super({
            name: 'products',
            allowApiCRUD: c => c.isSignedIn(),
            allowApiRead: c => c.isSignedIn()
        });
    }
};

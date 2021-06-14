import { Context, EntityClass, IdEntity, NumberColumn, StringColumn } from "@remult/core";
import { ProductIdColumn } from "../product/product";
import { OrderIdColumn } from "./order";

@EntityClass
export class OrderItem extends IdEntity {
    oid = new OrderIdColumn(this.context);
    product = new ProductIdColumn(this.context);
    quntity = new NumberColumn();//cur item quantity
    price = new NumberColumn({ decimalDigits: 2 });//cur item price
 
    constructor(private context: Context) {
        super({
            name: 'ordersItems',
            allowApiCRUD: c => c.isSignedIn(),
            allowApiRead: c => c.isSignedIn()
        });
    }
};

export class OrderItemIdColumn extends StringColumn {

}

export class OrderItemStatus {
    open = new OrderItemStatus();
    proccessing = new OrderItemStatus();
    closed = new OrderItemStatus();
    constructor() { }
}
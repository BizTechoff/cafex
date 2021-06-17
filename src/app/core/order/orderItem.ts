import { Context, EntityClass, IdEntity, NumberColumn, StringColumn } from "@remult/core";
import { ProductIdColumn } from "../product/product";
import { OrderIdColumn } from "./order";

@EntityClass
export class OrderItem extends IdEntity {
    oid = new OrderIdColumn(this.context,{caption: 'הזמנה'});
    pid = new ProductIdColumn(this.context,{caption: 'מוצר'});
    quntity = new NumberColumn({caption: 'כמות'});//cur item quantity
    price = new NumberColumn({ decimalDigits: 2 ,caption: 'מחיר'});//cur item price
 
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
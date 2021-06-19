import { Context, EntityClass, IdEntity, NumberColumn, StringColumn } from "@remult/core";
import { validNumber, validString } from "../../shared/utils";
import { ProductIdColumn } from "../product/product";
import { OrderIdColumn } from "./order";

@EntityClass
export class OrderItem extends IdEntity {
    oid = new OrderIdColumn(this.context, { caption: 'הזמנה' });
    pid = new ProductIdColumn(this.context, {
        caption: 'מוצר',
        validate: () => {
            if (!validString(this.pid, { notNull: true, minLength: 2 })) {
                throw this.pid.defs.caption + ': ' + this.pid.validationError;
            }
        }
    }); 
    quntity = new NumberColumn({
        caption: 'כמות',
        validate: () => {
            if (!validNumber(this.quntity, { notNull: true, minValue: 1 })) {
                throw this.quntity.defs.caption + ': ' + this.quntity.validationError;
            }
        }
    });//cur item quantity
    // price = new NumberColumn({ decimalDigits: 2 ,caption: 'מחיר'});//cur item price

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
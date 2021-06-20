import { extend, openDialog } from "@remult/angular";
import { Context, EntityClass, IdEntity, NumberColumn, StringColumn } from "@remult/core";
import { DynamicServerSideSearchDialogComponent } from "../../common/dynamic-server-side-search-dialog/dynamic-server-side-search-dialog.component";
import { validNumber, validString } from "../../shared/utils";
import { Roles } from "../../users/roles";
import { UserProduct, UserProductIdColumn } from "../../users/userProduct";
import { ProductIdColumn } from "../product/product";
import { Order, OrderIdColumn } from "./order";

@EntityClass
export class OrderItem extends IdEntity {
    upid = new UserProductIdColumn(this.context, { caption: 'Product' });
    oid = new OrderIdColumn(this.context, { caption: 'הזמנה' });
    pid = extend(new ProductIdColumn(this.context, {
        caption: 'מוצר',
        displayValue: () => this.pid.item.name.value,
        validate: () => {
            if (!validString(this.pid, { notNull: true, minLength: 2 })) {
                throw this.pid.defs.caption + ': ' + this.pid.validationError;
            }
        }
    })).dataControl(dcs => {
        dcs.hideDataOnInput = true;
        dcs.clickIcon = 'search';
        dcs.getValue = () => this.pid.displayValue;
        dcs.click = async () => {
            let o = await this.context.for(Order).findId(this.oid.value);
            let uid = o.uid.value;
            if (this.context.user.roles.includes(Roles.technician)) {
                uid = this.context.user.id;
            }
            await openDialog(DynamicServerSideSearchDialogComponent,
                dlg => dlg.args(UserProduct, {
                    onClear: () => this.pid.value = '',
                    onSelect: cur => this.pid.value = cur.id.value,
                    searchColumn: cur => cur.pid.item.name,
                    where: (cur) => cur.uid.isEqualTo(uid)
                })
            );
        };
    });
    // pid = new ProductIdColumn(this.context, {
    //     caption: 'מוצר',
    //     validate: () => {
    //         if (!validString(this.pid, { notNull: true, minLength: 2 })) {
    //             throw this.pid.defs.caption + ': ' + this.pid.validationError;
    //         }
    //     }
    // }); 
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
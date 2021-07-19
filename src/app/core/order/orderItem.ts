import { extend, openDialog } from "@remult/angular";
import { Context, DateTimeColumn, EntityClass, IdEntity, NumberColumn, StringColumn } from "@remult/core";
import { DynamicServerSideSearchDialogComponent } from "../../common/dynamic-server-side-search-dialog/dynamic-server-side-search-dialog.component";
import { TODAY } from "../../shared/types";
import { addDays, validNumber, validString } from "../../shared/utils";
import { Roles } from "../../users/roles";
import { UserProduct, UserProductIdColumn } from "../../users/userProduct/userProduct";
import { UserId } from "../../users/users";
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
            validString(this.pid, { notNull: true, minLength: 2 });
        }
    })).dataControl(it => {
        // dcs.width = '400';
        it.hideDataOnInput = true;
        it.clickIcon = 'search';
        it.getValue = () => this.pid.displayValue;
        it.click = async () => {
            let uid = this.context.user.id;//individual order-items
            if (!(this.context.user.roles.includes(Roles.technician) || this.context.user.roles.includes(Roles.store))) {
                let o = await this.context.for(Order).findId(this.oid.value);
                uid = o.uid.value;//the store-user-id of order (agent & admin input order-items in specific store)
            }
            await openDialog(DynamicServerSideSearchDialogComponent,
                dlg => dlg.args(UserProduct, {
                    onClear: () => this.pid.value = '',
                    onSelect: cur => this.pid.value = cur.cid.value,
                    searchColumn: cur => cur.cid.item.name,
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
            validNumber(this.quntity, { notNull: true, minValue: 1 });
        }
    });//cur item quantity
    // price = new NumberColumn({ decimalDigits: 2 ,caption: 'מחיר'});//cur item price

    remark = new StringColumn({ caption: 'הערה' });
    created = new DateTimeColumn({ caption: 'נוצר' });
    createdBy = new UserId(this.context, Roles.admin, { caption: 'נוצר ע"י' });
    modified = new DateTimeColumn({ caption: 'השתנה' });
    modifiedBy = new UserId(this.context, Roles.admin, { caption: 'השתנה ע"י' });

    constructor(private context: Context) {
        super({
            caption: 'שורות הזמנה',
            name: 'ordersItems',
            allowApiCRUD: c => c.isSignedIn(),
            allowApiRead: c => c.isSignedIn(),
            saving: async () => {
                if (context.onServer) {
                    if (this.isNew()) {
                        this.created.value = addDays(TODAY, undefined, false);
                        this.createdBy.value = this.context.user.id;
                    } else {
                        this.modified.value = addDays(TODAY, undefined, false);
                        this.modifiedBy.value = this.context.user.id;
                    }
                }
            }
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
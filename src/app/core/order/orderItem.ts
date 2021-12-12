import { extend, openDialog } from "@remult/angular";
import { Context, DateTimeColumn, EntityClass, IdEntity, NumberColumn, StringColumn } from "@remult/core";
import { DynamicServerSideSearchDialogComponent } from "../../common/dynamic-server-side-search-dialog/dynamic-server-side-search-dialog.component";
import { TODAY } from "../../shared/types";
import { addDays, validNumber, validString } from "../../shared/utils";
import { Roles } from "../../users/roles";
import { UserProduct } from "../../users/userProduct/userProduct";
import { UserId } from "../../users/users";
import { Container } from "../container/container";
import { ContainerItem } from "../container/containerItem";
import { Product, ProductIdColumn } from "../product/product";
import { Order, OrderIdColumn } from "./order";

@EntityClass
export class OrderItem extends IdEntity {
    // upid = new UserProductIdColumn(this.context, { caption: 'Product' });
    oid = new OrderIdColumn(this.context, { caption: 'הזמנה' });
    pid = extend(new ProductIdColumn(this.context, {
        caption: 'פריט',
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
            let pids = [] as string[];
            if (this.oid.item && !this.oid.item.sid.value) {
                await this.oid.item.reload();
            }
            if (this.isTechnical()) {
                pids.push(...await this.getAllProductIdsFromContainer(this.oid.item.sid.value));
                pids.push(...await this.getAllProductIdsFromContainer(this.context.user.id));
            }
            else if (this.oid.item.sid.value) {
                pids.push(...await this.getAllProductIdsFromStore(this.oid.item.sid.value));
            }
            await openDialog(DynamicServerSideSearchDialogComponent,
                it => it.args(Product, {
                    onClear: () => this.pid.value = '',
                    onSelect: row => this.pid.value = row.id.value,
                    searchColumn: row => row.name,
                    where: row => row.id.isIn(...pids)
                })
            );
        };
    });

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
            }//,
            // saved: async () => {
            //     console.log(`OrderItem.saved { originalValue: ${this.quntity.originalValue}, value: ${this.quntity.value}, wasChanged() => ${this.quntity.wasChanged()}, pid: { waschanged() => ${this.pid.wasChanged()}, id: ${this.pid.value}} } } `);
            //     if (context.onServer) {
            //         let o = await this.context.for(Order).findId(this.oid.value);
            //         if (o) {
            //             if (o.type.isTechnical()) {
            //                 if (this.pid.wasChanged() || this.quntity.wasChanged()) {
            //                     let itm = await this.getContItemFromContainer(o.sid.value);
            //                     if (itm) {
            //                         itm.quantity.value = (itm.quantity.value - (this.quntity.originalValue ? this.quntity.originalValue : 0)) + this.quntity.value;
            //                         await itm.save();
            //                     }
            //                 }
            //             } 
            //         }
            //     }
            // },
            // deleted: async () => {
            //     console.log(`OrderItem.deleted { originalValue: ${this.quntity.originalValue}, value: ${this.quntity.value}, wasChanged() => ${this.quntity.wasChanged()}, pid: { waschanged() => ${this.pid.wasChanged()}, id: ${this.pid.value}} } } `);
            //     if (context.onServer) {
            //         let o = await this.context.for(Order).findId(this.oid.value);
            //         if (o) {
            //             if (o.type.isTechnical()) {
            //                 let itm = await this.getContItemFromContainer(o.sid.value);
            //                 if (itm) {
            //                     itm.quantity.value = itm.quantity.value + this.quntity.originalValue;
            //                     await itm.save();
            //                 }
            //             }
            //         }
            //     }
            // }
        });
    }

    isTechnical() { return this.context.isAllowed(Roles.technician); }

    async getAllProductIdsFromContainer(uid: string) {
        let result: string[] = [] as string[];
        let con = await this.context.for(Container).findFirst({
            where: row => row.uid.isEqualTo(uid)
        })
        if (con) {
            for await (const itm of this.context.for(ContainerItem).iterate({
                where: row => row.conid.isEqualTo(con.id)
            })) {
                result.push(itm.pid.value);
            }
        }
        return result;
    }

    async getAllProductIdsFromStore(uid: string) {
        let result: string[] = [] as string[];
        for await (const up of this.context.for(UserProduct).iterate({
            where: row => row.uid.isEqualTo(uid)
        })) {
            result.push(up.pid.value);
        }
        return result;
    }

    async getContItemFromContainer(uid: string) {
        let result: ContainerItem;
        // store | technical | agent | admin => uid
        let con = await this.context.for(Container).findFirst({ where: row => row.uid.isEqualTo(uid) });
        if (con) {
            result = await this.context.for(ContainerItem).findFirst({ where: row => row.conid.isEqualTo(con.id).and(row.pid.isEqualTo(this.pid)) });
        }
        else {
            con = await this.context.for(Container).findFirst({ where: row => row.uid.isEqualTo(this.context.user.id) });
            if (con) {
                result = await this.context.for(ContainerItem).findFirst({ where: row => row.conid.isEqualTo(con.id).and(row.pid.isEqualTo(this.pid)) });
            }
        }
        return result;
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
import { extend, openDialog } from "@remult/angular";
import { ColumnSettings, Context, EntityClass, IdEntity, LookupColumn } from "@remult/core";
import { DynamicServerSideSearchDialogComponent } from "../../common/dynamic-server-side-search-dialog/dynamic-server-side-search-dialog.component";
import { Product, ProductIdColumn } from "../../core/product/product";
import { validString } from "../../shared/utils";
import { Roles } from "../roles";
import { UserId, Users } from "../users";
 
@EntityClass
export class UserProduct extends IdEntity {
    uid = extend(new UserId(this.context, Roles.store, {
        validate: () => {
            if (!validString(this.uid, { notNull: true, minLength: 3 })) {
                throw this.uid.defs.caption + ': ' + this.uid.validationError;
            }
        }
    })).dataControl(it => {
        it.caption = 'בית קפה/טכנאי',
        it.hideDataOnInput = true;
        it.clickIcon = 'search';
        it.getValue = () => this.uid.displayValue;
        it.click = async () => {
            await openDialog(DynamicServerSideSearchDialogComponent,
                dlg => dlg.args(Users, {
                    onClear: () => this.uid.value = '',
                    onSelect: cur => this.uid.value = cur.id.value,
                    searchColumn: cur => cur.name,
                    where: (cur) => cur.store.isEqualTo(true).or(cur.technician.isEqualTo(true))
                })
            );
        };
    });
    cid = extend(new ProductIdColumn(this.context, {
        caption: 'מוצר',
        validate: () => {
            if (!validString(this.cid, { notNull: true, minLength: 2 })) {
                throw this.cid.defs.caption + ': ' + this.cid.validationError;
            }
        }
    })).dataControl(dcs => {
        dcs.hideDataOnInput = true;
        dcs.clickIcon = 'search';
        dcs.getValue = () => this.cid.displayValue;
        dcs.click = async () => {
            await openDialog(DynamicServerSideSearchDialogComponent,
                dlg => dlg.args(Product, {
                    onClear: () => this.cid.value = '',
                    onSelect: cur => this.cid.value = cur.id.value,
                    searchColumn: cur => cur.name//,
                    // where: (cur) => cur.uid.item.store.isEqualTo(true)// cur.uid.isEqualTo(this.uid)
                })
            );
        };
    });
    constructor(private context: Context) {
        super({caption: context.isAllowed(Roles.technician)? 'פריטים' : 'מוצרים',
            name: 'usersProducts',
            allowApiCRUD: Roles.admin,
            allowApiRead: c => c.isSignedIn()
        });
    }
}

export class UserProductIdColumn extends LookupColumn<UserProduct> {
    constructor(context: Context, settings?: ColumnSettings<string>) {
        super(context.for(UserProduct), {
            caption: 'מוצר',
            displayValue: () => this.item.cid.displayValue,
            ...settings
        });
        extend(this).dataControl(dcs => {
            dcs.hideDataOnInput = true;
            dcs.clickIcon = 'search';
            dcs.getValue = () => this.displayValue;
            dcs.click = async () => {
                await openDialog(DynamicServerSideSearchDialogComponent,
                    dlg => dlg.args(UserProduct, {
                        onClear: () => this.value = '',
                        onSelect: cur => this.value = cur.id.value,
                        searchColumn: cur => cur.cid
                    })
                );
            };
        });
    }
    isEmpty(): boolean {
        return this.value && this.value.length > 0 ? false : true;
    }
}

export class ProductUserIdColumn extends LookupColumn<UserProduct> {
    constructor(context: Context, settings?: ColumnSettings<string>) {
        super(context.for(UserProduct), {
            caption: 'משתמש',
            displayValue: () => this.item.cid.displayValue,
            ...settings
        });
        extend(this).dataControl(dcs => {
            dcs.hideDataOnInput = true;
            dcs.clickIcon = 'search';
            dcs.getValue = () => this.displayValue;
            dcs.click = async () => {
                await openDialog(DynamicServerSideSearchDialogComponent,
                    dlg => dlg.args(UserProduct, {
                        onClear: () => this.value = '',
                        onSelect: cur => this.value = cur.uid.value,
                        searchColumn: cur => cur.uid
                    })
                );
            };
        });
    }
    isEmpty(): boolean {
        return this.value && this.value.length > 0 ? false : true;
    }
}

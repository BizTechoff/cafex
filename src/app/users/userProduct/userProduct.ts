import { extend, openDialog } from "@remult/angular";
import { ColumnSettings, Context, EntityClass, IdEntity, LookupColumn } from "@remult/core";
import { DynamicServerSideSearchDialogComponent } from "../../common/dynamic-server-side-search-dialog/dynamic-server-side-search-dialog.component";
import { Product, ProductIdColumn, ProductType } from "../../core/product/product";
import { FILTER_IGNORE } from "../../shared/types";
import { validString } from "../../shared/utils";
import { Roles } from "../roles";
import { UserId, Users } from "../users";

@EntityClass
export class UserProduct extends IdEntity {
    uid = extend(new UserId(this.context, {
        validate: () => {
            validString(this.uid, { notNull: true, minLength: 3 });
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
    pid = extend(new ProductIdColumn(this.context, {
        caption: 'פריט',
        validate: () => {
            validString(this.pid, { notNull: true, minLength: 2 });
        }
    })).dataControl(dcs => {
        dcs.hideDataOnInput = true;
        dcs.clickIcon = 'search';
        dcs.getValue = () => this.pid.displayValue;
        dcs.click = async () => {
            await openDialog(DynamicServerSideSearchDialogComponent,
                dlg => dlg.args(Product, {
                    onClear: () => this.pid.value = '',
                    onSelect: cur => this.pid.value = cur.id.value,
                    searchColumn: cur => cur.name,
                    where: cur => this.uid.isTechnical() ? cur.type.isEqualTo(ProductType.technical) : cur.type.isEqualTo(ProductType.regular)
                }));
        };
    });
    constructor(private context: Context) {
        super({
            caption: context.isAllowed(Roles.technician) ? 'פריטים' : 'פריטים',
            name: 'usersProducts',
            allowApiCRUD: Roles.admin,
            allowApiRead: c => c.isSignedIn()
        });
    }
}

export class UserProductIdColumn extends LookupColumn<UserProduct> {
    constructor(context: Context, uid?: string, settings?: ColumnSettings<string>) {
        super(context.for(UserProduct), {
            caption: 'פריט',
            displayValue: () => this.item.pid.displayValue,
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
                        searchColumn: cur => cur.pid.item.name,
                        where: cur => uid ? cur.uid.isEqualTo(uid) : FILTER_IGNORE
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
            displayValue: () => this.item.pid.displayValue,
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

import { extend, openDialog } from "@remult/angular";
import { ColumnSettings, Context, EntityClass, IdEntity, LookupColumn } from "@remult/core";
import { DynamicServerSideSearchDialogComponent } from "../common/dynamic-server-side-search-dialog/dynamic-server-side-search-dialog.component";
import { ProductIdColumn } from "../core/product/product";
import { validString } from "../shared/utils";
import { Roles } from "./roles";
import { UserId } from "./users";

@EntityClass
export class UserProduct extends IdEntity {
    uid = new UserId(this.context, Roles.store, {
        validate: () => {
            if (!validString(this.uid, { notNull: true, minLength: 3 })) {
                throw this.uid.defs.caption + ': ' + this.uid.validationError;
            }
        }
    });
    pid = new ProductIdColumn(this.context, {
        validate: () => {
            if (!validString(this.pid, { notNull: true, minLength: 3 })) {
                throw this.pid.defs.caption + ': ' + this.pid.validationError;
            }
        }
    }); 
    constructor(private context: Context) {
        super({
            name: 'usersProducts',
            allowApiCRUD: Roles.admin,
            allowApiRead: c => c.isSignedIn()
        });
    }
}

export class UserProductIdColumn extends LookupColumn<UserProduct> {
    constructor(context: Context, settings?: ColumnSettings<string>) {
        super(context.for(UserProduct), {
            caption: 'Product',
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
                        searchColumn: cur => cur.pid
                    })
                );
            };
        });
    }
    isEmpty(): boolean {
        return this.value && this.value.length > 0 ? false : true;
    }
}

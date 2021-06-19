import { extend, openDialog } from "@remult/angular";
import { checkForDuplicateValue, ColumnSettings, Context, EntityClass, IdEntity, LookupColumn, StringColumn } from "@remult/core";
import { DynamicServerSideSearchDialogComponent } from "../../common/dynamic-server-side-search-dialog/dynamic-server-side-search-dialog.component";
import { validString } from "../../shared/utils";
import { Roles } from "../../users/roles";

@EntityClass
export class Category extends IdEntity {
    name = new StringColumn({
        caption: 'שם קבוצה ראשית',
        validate: () => {
            if (!validString(this.name, { notNull: true, minLength: 3 })) {
                throw this.name.defs.caption + ': ' + this.name.validationError;
            }
        }
    });
    constructor(private context: Context) {
        super({
            name: 'categories',
            allowApiCRUD: Roles.admin,
            allowApiRead: c => c.isSignedIn(),
            saving: async () => {
                if(context.onServer){
                    await checkForDuplicateValue(this, this.name, this.context.for(Category));
                }
            }
        });
    }
}

export class CategoryIdColumn extends LookupColumn<Category> {
    constructor(context: Context, settings?: ColumnSettings<string>) {
        super(context.for(Category), {
            displayValue: () => this.item.name.value,
            ...settings
        });
        extend(this).dataControl(dcs => {
            dcs.hideDataOnInput = true;
            dcs.clickIcon = 'search';
            dcs.getValue = () => this.displayValue;
            dcs.click = async () => {
                await openDialog(DynamicServerSideSearchDialogComponent,
                    dlg => dlg.args(Category, {
                        onClear: () => this.value = '',
                        onSelect: cur => this.value = cur.id.value,
                        searchColumn: cur => cur.name
                    })
                );
            };
        });
    }
    isEmpty(): boolean {
        return this.value && this.value.length > 0 ? false : true;
    }
}

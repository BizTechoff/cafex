import { extend, openDialog } from "@remult/angular";
import { ColumnSettings, Context, EntityClass, IdEntity, LookupColumn, StringColumn } from "@remult/core";
import { DynamicServerSideSearchDialogComponent } from "../../common/dynamic-server-side-search-dialog/dynamic-server-side-search-dialog.component";
import { FILTER_IGNORE } from "../../shared/types";
import { Roles } from "../../users/roles";
import { CategoryIdColumn } from "./category";

@EntityClass
export class CategoryItem extends IdEntity {
    cid = new CategoryIdColumn(this.context, { caption: 'קטגוריה ראשית' });
    name = new StringColumn({ caption: 'תיאור' });
    constructor(private context: Context) {
        super({
            name: 'categoriesItems',
            allowApiCRUD: Roles.admin,
            allowApiRead: c => c.isSignedIn()
        });
    }
}

export class CategoryItemIdColumn extends LookupColumn<CategoryItem> {
    cid?: string;
    constructor(context: Context, settings?: ColumnSettings<string>) {
        super(context.for(CategoryItem), {
            displayValue: () => this.item.name.value,
            ...settings
        });
        extend(this).dataControl(dcs => {
            dcs.hideDataOnInput = true;
            dcs.clickIcon = 'search';
            dcs.getValue = () => this.displayValue;
            dcs.click = async () => { 
                console.log('cid='+this.cid);
                await openDialog(DynamicServerSideSearchDialogComponent,
                    dlg => dlg.args(CategoryItem, {
                        onClear: () => this.value = '',
                        onSelect: cur => this.value = cur.id.value,
                        searchColumn: cur => cur.name,
                        where: (cur) => this.cid && this.cid.length > 0 ? cur.cid.isEqualTo(this.cid) : FILTER_IGNORE
                    })
                );
            };
        });
    }
    isEmpty(): boolean {
        return this.value && this.value.length > 0 ? false : true;
    }
}

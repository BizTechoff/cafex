import { extend, openDialog } from "@remult/angular";
import { checkForDuplicateValue, ColumnSettings, Context, EntityClass, IdEntity, LookupColumn, StringColumn } from "@remult/core";
import { DynamicServerSideSearchDialogComponent } from "../../common/dynamic-server-side-search-dialog/dynamic-server-side-search-dialog.component";
import { FILTER_IGNORE } from "../../shared/types";
import { validString } from "../../shared/utils";
import { Roles } from "../../users/roles";
import { CategoryIdColumn } from "./category";

@EntityClass
export class CategoryItem extends IdEntity {
    cid = new CategoryIdColumn(this.context, { caption: 'קטגוריה ראשית' });
    name = new StringColumn({
        caption: 'שם קבוצה משנית',
        validate: () => {
            if (!validString(this.name, { notNull: true, minLength: 2 })) {
                throw this.name.defs.caption + ': ' + this.name.validationError;
            }
        }
    });
    constructor(private context: Context) {
        super({
            caption: 'קטגוריה משנית',
            name: 'categoriesItems',
            allowApiCRUD: Roles.admin,
            allowApiRead: c => c.isSignedIn(),
            saving: async () => {
                if(context.onServer){
                    await checkForDuplicateValue(this, this.name, this.context.for(CategoryItem));
                }
            }
        });
    }
}

export class CategoryItemIdColumn extends LookupColumn<CategoryItem> {
    constructor(context: Context, settings?: ColumnSettings<string>) {
        super(context.for(CategoryItem), {
            displayValue: () => this.item.name.value,
            ...settings
        });
      
    }
    isEmpty(): boolean {
        return this.value && this.value.length > 0 ? false : true;
    }
}

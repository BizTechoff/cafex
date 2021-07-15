import { extend, openDialog } from "@remult/angular";
import { checkForDuplicateValue, ColumnSettings, Context, EntityClass, IdEntity, LookupColumn, StringColumn } from "@remult/core";
import { DynamicServerSideSearchDialogComponent } from "../../common/dynamic-server-side-search-dialog/dynamic-server-side-search-dialog.component";
import { validString } from "../../shared/utils";
import { Roles } from "../../users/roles";
import { CategoryItem } from "./categoryItem";

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
    count: number;

    getCount() {
        if (this.count !== undefined)
            return this.count;
        this.count = 0;
        this.context.for(CategoryItem).count(c => c.cid.isEqualTo(this.id)).then(result => { this.count = result; })
        return this.count;
    }
    constructor(private context: Context) {
        super({
            caption: 'קטגוריה ראשית',
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
        
    }
    isEmpty(): boolean {
        return this.value && this.value.length > 0 ? false : true;
    }
}

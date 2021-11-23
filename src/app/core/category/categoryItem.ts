import { extend, openDialog } from "@remult/angular";
import { checkForDuplicateValue, ColumnSettings, Context, EntityClass, IdEntity, LookupColumn, ServerFunction, StringColumn } from "@remult/core";
import { DynamicServerSideSearchDialogComponent } from "../../common/dynamic-server-side-search-dialog/dynamic-server-side-search-dialog.component";
import { FILTER_IGNORE, MagicGetCategoriesItems, MagicGetCategoriesItemsResponse } from "../../shared/types";
import { validString } from "../../shared/utils";
import { Roles } from "../../users/roles";
import { CategoryIdColumn } from "./category";

@EntityClass
export class CategoryItem extends IdEntity {
    cid = new CategoryIdColumn(this.context, { caption: 'קטגוריה ראשית' });
    name = new StringColumn({
        caption: 'שם קבוצה משנית',
        validate: () => {
            validString(this.name, { notNull: true, minLength: 2 });
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

    @ServerFunction({ allowed: true })
    static async getCategoriesItems(req: MagicGetCategoriesItems, context?: Context) {
        let r: MagicGetCategoriesItemsResponse[] = [];
        for await (const c of context.for(CategoryItem).iterate({
            where: row => {
                let result = FILTER_IGNORE;
                if (req.id) {
                    result = result.and(row.id.isEqualTo(req.id));
                }
                else if (req.categoryid) {
                    result = result.and(row.cid.isEqualTo(req.categoryid));
                }
                return result;
            }
        })) {
            r.push({
                id: c.id.value,
                categoryid: c.cid.value,
                name: c.name.value
            });
        }
        return r;
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

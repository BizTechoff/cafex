import { extend, openDialog } from "@remult/angular";
import { checkForDuplicateValue, ColumnSettings, Context, EntityClass, IdEntity, LookupColumn, ServerFunction, StringColumn } from "@remult/core";
import { DynamicServerSideSearchDialogComponent } from "../../common/dynamic-server-side-search-dialog/dynamic-server-side-search-dialog.component";
import { FILTER_IGNORE, MagicGetCategories, MagicGetCategoriesResponse } from "../../shared/types";
import { validString } from "../../shared/utils";
import { Roles } from "../../users/roles";
import { CategoryItem } from "./categoryItem";

@EntityClass
export class Category extends IdEntity {
    name = new StringColumn({
        caption: 'שם קבוצה ראשית',
        validate: () => {
            validString(this.name, { notNull: true, minLength: 3 });
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

    @ServerFunction({ allowed: true })
    static async getCategories(req: MagicGetCategories, context?: Context) {
        let r: MagicGetCategoriesResponse[] = [];
        for await (const c of context.for(Category).iterate({
            where: row => {
                let result = FILTER_IGNORE;
                if (req.id) {
                    result = result.and(row.id.isEqualTo(req.id));
                }
                return result;
            }
        })) {
            r.push({
                id: c.id.value,
                name: c.name.value
            });
        }
        return r;
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

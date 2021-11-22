import { extend, openDialog } from "@remult/angular";
import { ColumnSettings, Context, EntityClass, IdEntity, LookupColumn, StringColumn } from "@remult/core";
import { DynamicServerSideSearchDialogComponent } from "../../common/dynamic-server-side-search-dialog/dynamic-server-side-search-dialog.component";
import { validString } from "../../shared/utils";
import { Roles } from "../../users/roles";
import { UserProduct } from "../../users/userProduct/userProduct";
import { Category, CategoryIdColumn } from "../category/category";
import { CategoryItem, CategoryItemIdColumn } from "../category/categoryItem";


export class ProductType {
    static general = new ProductType();
    static select = new ProductType();
    constructor() { }
    id: number;
}

@EntityClass
export class Product extends IdEntity {
    cid = extend(new CategoryIdColumn(this.context, {
        caption: 'קבוצה ראשית',
        validate: () => {
            validString(this.cid, { notNull: true, minLength: 3 });
        }
    })).dataControl(it => {
        it.hideDataOnInput = true;
        it.clickIcon = 'search';
        it.getValue = () => this.cid.displayValue;
        it.click = async () => {
            await openDialog(DynamicServerSideSearchDialogComponent,
                dlg => dlg.args(Category, {
                    onClear: () => this.cid.value = '',
                    onSelect: cur => {
                        this.cid.value = cur.id.value;
                        this.ciid.value = '';
                    },
                    searchColumn: cur => cur.name
                })
            );
        };
    });
    ciid = extend(new CategoryItemIdColumn(this.context, {
        caption: 'קבוצה משנית',
        validate: () => {
            validString(this.ciid, { notNull: true, minLength: 3 });
        }
    })).dataControl(it => {
        // it.readOnly = this.cid.value && this.cid.value.length > 0 ? false : true;
        it.hideDataOnInput = true;
        it.clickIcon = 'search';
        it.getValue = () => this.ciid.displayValue;
        it.click = async () => {
            await openDialog(DynamicServerSideSearchDialogComponent,
                dlg => dlg.args(CategoryItem, {
                    onClear: () => this.ciid.value = '',
                    onSelect: cur => this.ciid.value = cur.id.value,
                    searchColumn: cur => cur.name,
                    where: (cur) => cur.cid.isEqualTo(this.cid)
                })
            );
        };
    });
    sku = new StringColumn({
        caption: 'מק"ט',
        validate: () => {
            validString(this.sku, { notNull: true, minLength: 3 });
        }
    });
    name = new StringColumn({
        caption: 'שם',
        validate: () => {
            validString(this.name, { notNull: true, minLength: 3 });
        }
    });
    count: number;

    getKey(){
        // return
    }

    getCount() {
        if (this.count !== undefined)
            return this.count;
        this.count = 0;
        this.context.for(UserProduct).count(c => c.pid.isEqualTo(this.id)).then(result => { this.count = result; })
        return this.count;
    }

    constructor(private context: Context) {
        super({
            caption: 'פריט',
            name: 'products',
            allowApiCRUD: c => c.isSignedIn(),
            allowApiRead: c => c.isSignedIn()
        });
    }
};

export class ProductIdColumn extends LookupColumn<Product> {
    constructor(context: Context, settings?: ColumnSettings<string>) {
        super(context.for(Product), {
            caption: context.isAllowed(Roles.technician) ? 'פריט' : 'פריט',
            displayValue: () => this.item.name.value
            , ...settings
        });
        extend(this).dataControl(it => {
            // dcs.width = '400';
            it.hideDataOnInput = true;
            it.clickIcon = 'search';
            it.getValue = () => this.displayValue;
            it.click = async () => {
                await openDialog(DynamicServerSideSearchDialogComponent,
                    it => it.args(Product, {
                        onClear: () => this.value = '',
                        onSelect: cur => this.value = cur.id.value,
                        searchColumn: cur => cur.name
                    })
                );
            };
        });
    }
}

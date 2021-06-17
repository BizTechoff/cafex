import { extend, openDialog } from "@remult/angular";
import { ColumnSettings, Context, EntityClass, IdEntity, LookupColumn, StringColumn } from "@remult/core";
import { DynamicServerSideSearchDialogComponent } from "../../common/dynamic-server-side-search-dialog/dynamic-server-side-search-dialog.component";
import { CategoryIdColumn } from "../category/category";
import { CategoryItemIdColumn } from "../category/categoryItem";

@EntityClass
export class Product extends IdEntity {
    cid = new CategoryIdColumn(this.context, {
        caption: 'קבוצה ראשית',
        valueChange: () => { this.ciid.cid = this.cid.value; }
    });
    ciid = new CategoryItemIdColumn(this.context, { caption: 'קבוצה משנית' });
    sku = new StringColumn({ caption: 'מק"ט' });//makat
    name = new StringColumn({ caption: 'שם' });

    constructor(private context: Context) {
        super({
            name: 'products',
            allowApiCRUD: c => c.isSignedIn(),
            allowApiRead: c => c.isSignedIn()
        });
    }
};

export class ProductIdColumn extends LookupColumn<Product> {
    constructor(context: Context, settings?: ColumnSettings<string>) {
        super(context.for(Product), {
            caption: 'Product',
            displayValue: () => this.item.name.value
            , ...settings
        });
        extend(this).dataControl(ctrl => {
            ctrl.hideDataOnInput = true;
            ctrl.clickIcon = 'search';
            ctrl.getValue = () => this.displayValue;
            ctrl.click = async () => {
                await openDialog(DynamicServerSideSearchDialogComponent,
                    dlg => dlg.args(Product, {
                        onClear: () => this.value = '',
                        onSelect: cur => this.value = cur.id.value,
                        searchColumn: cur => cur.name
                    }));
            };
        });
    }
}

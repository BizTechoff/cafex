import { extend, openDialog } from "@remult/angular";
import { ColumnSettings, Context, EntityClass, IdEntity, LookupColumn, NumberColumn, StringColumn } from "@remult/core";
import { DynamicServerSideSearchDialogComponent } from "../../common/dynamic-server-side-search-dialog/dynamic-server-side-search-dialog.component";
import { StoreIdColumn } from "../store/store";

@EntityClass
export class Product extends IdEntity {
    sid = new StoreIdColumn(this.context);
    name = new StringColumn();
    firstCategory = new StringColumn();
    secondCategory = new StringColumn();
    sku = new StringColumn();//makat
    quntity = new NumberColumn();//stock quantity
    price = new NumberColumn({ decimalDigits: 2 });//base price

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
            displayValue: () => this.item.name.value
            , ...settings
        });
        extend(this).dataControl(dcs => {
            dcs.hideDataOnInput = true;
            dcs.clickIcon = 'search';
            dcs.getValue = () => this.displayValue;
            dcs.click = async () => {
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

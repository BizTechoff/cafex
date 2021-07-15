import { extend, openDialog } from "@remult/angular";
import { ColumnSettings, Context, EntityClass, IdEntity, LookupColumn, StringColumn } from "@remult/core";
import { DynamicServerSideSearchDialogComponent } from "../../common/dynamic-server-side-search-dialog/dynamic-server-side-search-dialog.component";
import { Roles } from "../../users/roles";
import { Category, CategoryIdColumn } from "../category/category";
import { CategoryItem, CategoryItemIdColumn } from "../category/categoryItem";

@EntityClass
export class Product extends IdEntity {
    cid = extend(new CategoryIdColumn(this.context, {
        caption: 'קבוצה ראשית',

    })).dataControl(dcs => {
        dcs.hideDataOnInput = true;
        dcs.clickIcon = 'search';
        dcs.getValue = () => this.cid.displayValue;
        dcs.click = async () => {
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
    ciid = extend(new CategoryItemIdColumn(this.context, { caption: 'קבוצה משנית' })).dataControl(dcs => {
        dcs.hideDataOnInput = true;
        dcs.clickIcon = 'search';
        dcs.getValue = () => this.ciid.displayValue;
        dcs.click = async () => {
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
    sku = new StringColumn({ caption: 'מק"ט' });//makat
    name = new StringColumn({ caption: 'שם' });
    remark = new StringColumn({ caption: 'הערה' });

    constructor(private context: Context) {
        super({
            caption: 'מוצר',
            name: 'products',
            allowApiCRUD: c => c.isSignedIn(),
            allowApiRead: c => c.isSignedIn()
        });
    }
};

export class ProductIdColumn extends LookupColumn<Product> {
    constructor(context: Context, settings?: ColumnSettings<string>) {
        super(context.for(Product), {
            caption: context.isAllowed(Roles.technician) ? 'פריט' : 'מוצר',
            displayValue: () => this.item.name.value
            , ...settings
        });
        // extend(this).dataControl(ctrl => {
        //     ctrl.hideDataOnInput = true;
        //     ctrl.clickIcon = 'search';
        //     ctrl.getValue = () => this.displayValue;
        //     ctrl.click = async () => {
        //         await openDialog(DynamicServerSideSearchDialogComponent,
        //             dlg => dlg.args(Product, {
        //                 onClear: () => this.value = '',
        //                 onSelect: cur => this.value = cur.id.value,
        //                 searchColumn: cur => cur.name//,
        //                 // where: cur => cur.
        //             }));
        //     };
        // });
    }
}

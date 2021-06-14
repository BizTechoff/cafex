import { extend, openDialog } from "@remult/angular";
import { ColumnSettings, Context, EntityClass, IdEntity, LookupColumn, StringColumn } from "@remult/core";
import { DynamicServerSideSearchDialogComponent } from "../../common/dynamic-server-side-search-dialog/dynamic-server-side-search-dialog.component";

@EntityClass
export class Store extends IdEntity {
    name = new StringColumn({ caption: 'Store' });
    branch = new StringColumn();

    constructor(private context: Context) {
        super({
            name: 'stores',
            allowApiCRUD: c => c.isSignedIn(),
            allowApiRead: c => c.isSignedIn()
        });
    }
};


export class StoreIdColumn extends LookupColumn<Store> {

    constructor(context: Context, settings?: ColumnSettings<string>) {
        super(context.for(Store), {
            displayValue: () => this.item.name.value
            , ...settings
        });
        extend(this).dataControl(dcs => {
            dcs.hideDataOnInput = true;
            dcs.clickIcon = 'search';
            dcs.getValue = () => this.displayValue;
            dcs.click = async () => {
                await openDialog(DynamicServerSideSearchDialogComponent,
                    dlg => dlg.args(Store, {
                        onClear: () => this.value = '',
                        onSelect: cur => this.value = cur.id.value,
                        searchColumn: cur => cur.name
                    }));
            };
        });
    }

}

export class StoreStatus {
    active = new StoreStatus();
    disactive = new StoreStatus();
    constructor() { }
    id: string = '';//for ValueListItem
}

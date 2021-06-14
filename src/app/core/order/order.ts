import { extend, openDialog } from "@remult/angular";
import { BoolColumn, ColumnSettings, Context, DateColumn, DateTimeColumn, EntityClass, IdEntity, LookupColumn, NumberColumn, StringColumn, ValueListColumn } from "@remult/core";
import { DynamicServerSideSearchDialogComponent } from "../../common/dynamic-server-side-search-dialog/dynamic-server-side-search-dialog.component";
import { STARTING_ORDER_NUM } from "../../shared/types";
import { UserId } from "../../users/users";
import { StoreIdColumn } from "../store/store";

@EntityClass
export class Order extends IdEntity {
    orderNum = new NumberColumn({ allowApiUpdate: false });
    date = new DateColumn();
    status = new OrderStatusColumn();
    isImported = new BoolColumn({ caption: 'Imported?', defaultValue: false });
    created = new DateTimeColumn();
    createdBy = new UserId(this.context);
    modified = new DateTimeColumn();
    modifiedBy = new UserId(this.context);
    sid = new StoreIdColumn(this.context);

    constructor(private context: Context) {
        super({
            name: 'orders',
            allowApiCRUD: c => c.isSignedIn(),
            allowApiRead: c => c.isSignedIn(),
            saving: async () => {
                if (context.onServer) {
                    if (this.isNew()) {
                        let o = await context.for(Order).findFirst({
                            orderBy: () => [{ column: this.orderNum, descending: true }]
                        });
                        if (o && o.orderNum.value > 0) {
                            this.orderNum.value = o.orderNum.value + 1;
                        } else {
                            this.orderNum.value = STARTING_ORDER_NUM;
                        }
                    }
                }
            }
        });
    }
};

export class OrderIdColumn extends LookupColumn<Order> {
    constructor(context: Context, settings?: ColumnSettings<string>) {
        super(context.for(Order), {
            displayValue: () => this.item.orderNum.value.toString()
            , ...settings
        });
        extend(this).dataControl(dcs => {
            dcs.hideDataOnInput = true;
            dcs.clickIcon = 'search';
            dcs.getValue = () => this.displayValue;
            dcs.click = async () => {
                await openDialog(DynamicServerSideSearchDialogComponent,
                    dlg => dlg.args(Order, {
                        onClear: () => this.value = '',
                        onSelect: cur => this.value = cur.id.value,
                        searchColumn: cur => new StringColumn({ defaultValue: cur.orderNum.value.toString() })
                    }));
            };
        });
    }
}

export class OrderStatus {
    static closed = new OrderStatus();
    static working = new OrderStatus();
    static open = new OrderStatus();
    constructor() { }
    id: string = '';//for ValueListItem
}

export class OrderStatusColumn extends ValueListColumn<OrderStatus> {
    constructor(options?: ColumnSettings<OrderStatus>) {
        super(OrderStatus, {
            defaultValue: OrderStatus.open,
            ...options,
        });
    }
}
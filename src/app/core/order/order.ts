import { BoolColumn, ColumnSettings, Context, DateColumn, DateTimeColumn, EntityClass, IdEntity, NumberColumn, StringColumn, ValueListColumn } from "@remult/core";
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

export class OrderIdColumn extends StringColumn {

}

export class OrderStatus {
    static open = new OrderStatus();
    static wainting = new OrderStatus();
    static closed = new OrderStatus();
    constructor() { }
    id: string = '';//for ValueListItem
}

export class OrderStatusColumn extends ValueListColumn<OrderStatus> {
    constructor(options?: ColumnSettings<OrderStatus>) {
        super(OrderStatus, {
            defaultValue: OrderStatus.wainting,
            ...options
        });
    }
}
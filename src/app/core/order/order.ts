import { extend, openDialog } from "@remult/angular";
import { BoolColumn, ColumnSettings, Context, DateColumn, DateTimeColumn, EntityClass, IdEntity, LookupColumn, NumberColumn, ServerFunction, StringColumn, ValueListColumn, ValueListTypeInfo } from "@remult/core";
import { DynamicServerSideSearchDialogComponent } from "../../common/dynamic-server-side-search-dialog/dynamic-server-side-search-dialog.component";
import { FILTER_IGNORE, MagicGetOrders, STARTING_ORDER_NUM, TimeColumn, TODAY } from "../../shared/types";
import { addDays, addTime, validDate, validString } from "../../shared/utils";
import { Roles } from "../../users/roles";
import { UserId, Users } from "../../users/users";
import { OrderItem } from "./orderItem";

@EntityClass
export class Order extends IdEntity {
    type = extend(new OrderTypeColumn()).dataControl(x => {
        let v = [] as OrderType[];
        for (const t of ValueListTypeInfo.get(OrderType).getOptions()) {
            if (!t.isNormal() && !t.isAll()) {
                v.push(t);
            }
        }
        // v.sort((a,b) => a.caption.localeCompare(b.caption));
        x.valueList = v;
    });
    uid = extend(new UserId(this.context, Roles.store, {
        caption: 'בית קפה',
        validate: () => {
            validString(this.uid, { notNull: true, minLength: 3 });
        }
    })).dataControl(dcs => {
        dcs.hideDataOnInput = true;
        dcs.clickIcon = 'search';
        dcs.getValue = () => this.uid.displayValue;
        dcs.click = async () => {
            await openDialog(DynamicServerSideSearchDialogComponent,
                dlg => dlg.args(Users, {
                    onClear: () => this.uid.value = '',
                    onSelect: cur => this.uid.value = cur.id.value,
                    searchColumn: cur => cur.name,
                    where: (cur) => cur.store.isEqualTo(true)
                })
            );
        };
    });
    magicId = new StringColumn({ allowApiUpdate: false });
    orderNum = new NumberColumn({ allowApiUpdate: false, dbReadOnly: true, caption: 'מס.הזמנה' });

    date = new DateColumn({
        caption: 'תאריך',
        defaultValue: addDays(TODAY, undefined, true),
        validate: () => {
            validDate(this.date, { notNull: true, minYear: 2000 });
            if (this.isNew()) {
                validDate(this.date, { greaterThenToday: true });
            }
            // if (!validDate(this.date, { notNull: true, minYear: 2000 })) {
            //     throw this.date.defs.caption + ': ' + this.date.validationError;
            // }
            // if (this.isNew()) {
            //     if (!validDate(this.date, { greaterThenToday: true })) {
            //         throw this.date.defs.caption + ': ' + this.date.validationError;
            //     }
            // }
        }
    });
    worker = new StringColumn({
        caption: 'שם עובד ממלא',
        validate: () => {
            if (this.context.isAllowed(Roles.store)) {
                validString(this.worker, { notNull: true, minLength: 3 });
            }
        }
    });
    time = new TimeColumn({ caption: 'שעה' });
    status = new OrderStatusColumn();
    remark = new StringColumn({ caption: 'הערה' });
    // validate: {
    //     let result =[] as ColumnValidator<string>[];
    //     if(this.type.isTechnical()) {
    //         result.push(Validators.required);
    //     }
    //     return result;
    // }
    isImported = new BoolColumn({ caption: 'נטען?', defaultValue: false });
    created = new DateTimeColumn({ caption: 'נוצר' });
    createdBy = new UserId(this.context, Roles.admin, { caption: 'נוצר ע"י' });
    modified = new DateTimeColumn({ caption: 'השתנה' });
    modifiedBy = new UserId(this.context, Roles.admin, { caption: 'השתנה ע"י' });
    closed = new DateTimeColumn({ caption: 'נסגרה' });
    closedBy = new UserId(this.context, Roles.admin, { caption: 'נסגרה ע"י' });
    count: number;

    getCount() {
        if (this.count !== undefined)
            return this.count;
        this.count = 0;
        this.context.for(OrderItem).count(c => c.oid.isEqualTo(this.id)).then(result => { this.count = result; })
        return this.count;
    }

    constructor(private context: Context) {
        super({
            name: 'orders',
            allowApiCRUD: c => c.isSignedIn(),
            allowApiRead: c => c.isSignedIn(),
            defaultOrderBy: () => [this.uid, this.date, this.type],
            apiDataFilter: () => {
                let result = FILTER_IGNORE;
                if (this.isStore()) {
                    result = result.and(this.uid.isEqualTo(this.context.user.id));
                }
                return result;
            },
            saving: async () => {
                if (context.onServer) {
                    if (this.date.wasChanged()) {
                        this.time.value = addTime();
                    }
                    if (this.isNew()) {
                        let o = await context.for(Order).findFirst({
                            orderBy: () => [{ column: this.orderNum, descending: true }]
                        });
                        if (o && o.orderNum.value > 0) {
                            this.orderNum.value = o.orderNum.value + 1;
                        } else {
                            this.orderNum.value = STARTING_ORDER_NUM;
                        }
                        this.created.value = addDays(TODAY, undefined, false);
                        this.createdBy.value = this.context.user.id;
                    } else {
                        this.modified.value = addDays(TODAY, undefined, false);
                        this.modifiedBy.value = this.context.user.id;
                        if (this.status.wasChanged()) {
                            if (this.status.value.isClosed()) {
                                this.closed.value = addDays(TODAY, undefined, false);
                                this.closedBy.value = this.context.user.id;
                            }
                        }
                    }
                }
            }
        });
    }

    isStore() {
        return this.context.user.roles.length == 1 && this.context.user.roles.includes(Roles.store);
        // return this.context.isAllowed(Roles.store);
    }

    isTechnician() {
        return this.context.isAllowed(Roles.technician);
    }

    @ServerFunction({ allowed: true })
    static async getOrders(req: MagicGetOrders, context?: Context) {
        let r: theResult[] = [];
        for await (const o of context.for(Order).iterate({
            where: row =>
                req.id
                    ? row.id.isEqualTo(req.id)
                    : req.magicId
                        ? row.magicId.isEqualTo(req.magicId)
                        : req.orderNum
                            ? row.orderNum.isEqualTo(req.orderNum)
                            : req.fdate
                                ? row.date.isGreaterOrEqualTo(req.fdate)
                                    .and(req.tdate
                                        ? row.date.isLessOrEqualTo(req.tdate)
                                        : FILTER_IGNORE)
                                : FILTER_IGNORE
                                    .and(req.status
                                        ? row.status.isEqualTo(req.status)
                                        : FILTER_IGNORE)
        })) {
            r.push({
                date: o.date.value,
                status: o.status.value.id
            })
        }
        return r;
    }
};
interface theResult {
    date: Date,
    status: string
}

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
    static open = new OrderStatus('פתוחה');
    static closed = new OrderStatus('סופקה');
    constructor(caption = '') { this.caption = caption; }
    id: string;
    caption: string;
    isOpen() { return this === OrderStatus.open; }
    isClosed() { return this === OrderStatus.closed; }
    static fromString(id: string) {
        if (id === OrderStatus.closed.id) {
            return OrderStatus.closed;
        }
        return OrderStatus.open;
    }
}

export class OrderStatusColumn extends ValueListColumn<OrderStatus> {
    constructor(all = false, options?: ColumnSettings<OrderStatus>) {
        super(OrderStatus, {
            caption: 'סטטוס',
            defaultValue: OrderStatus.open,// all ? { caption: 'הכל', id: 'all' } : OrderStatus.open,
            ...options
        });
        extend(this).dataControl(x => {
            x.valueList = ValueListTypeInfo.get(OrderStatus).getOptions()
            // all
            //     ? x.valueList = [{ caption: 'הכל', id: 'all' }, ...this.getOptions()]
            //     : x.valueList = ValueListTypeInfo.get(OrderStatus).getOptions()
        });
    }
}

export class OrderType {
    static normal = new OrderType('רגילה');
    static maintenance = new OrderType('תחזוקה');
    static fault = new OrderType('תקלה');
    static all = new OrderType('הכל');
    constructor(caption = '') { this.caption = caption; }
    id: string;
    caption: string;
    isTechnical() {
        return OrderType.technicalTypes.includes(this);
    }
    isAll() { return this === OrderType.all; }
    isNormal() { return this === OrderType.normal; }
    static technicalTypes = [OrderType.fault, OrderType.maintenance];
    static fromString(id: string) {
        if (id === OrderType.normal.id) {
            return OrderType.normal;
        }
        if (id === OrderType.maintenance.id) {
            return OrderType.maintenance;
        }
        if (id === OrderType.fault.id) {
            return OrderType.fault;
        }
        return OrderType.all;
    }
}
export class OrderTypeColumn extends ValueListColumn<OrderType> {
    constructor(options?: ColumnSettings<OrderType>) {
        super(OrderType, {
            caption: 'סוג',
            defaultValue: OrderType.normal,
            ...options
        });
    }
    isNormal() { return this.value && this.value.isNormal(); }
    isTechnical() { return this.value && this.value.isTechnical(); }
    isAll() { return this.value && this.value.isAll(); }
}

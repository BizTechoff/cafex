import { Component, OnInit } from '@angular/core';
import { extend, GridSettings, openDialog } from '@remult/angular';
import { Context, NumberColumn, ValueListTypeInfo } from '@remult/core';
import { DialogService } from '../../../common/dialog';
import { DynamicServerSideSearchDialogComponent } from '../../../common/dynamic-server-side-search-dialog/dynamic-server-side-search-dialog.component';
import { InputAreaComponent } from '../../../common/input-area/input-area.component';
import { FILTER_IGNORE } from '../../../shared/types';
import { addDays, addTime } from '../../../shared/utils';
import { Roles } from '../../../users/roles';
import { UserId, Users } from '../../../users/users';
import { Order, OrderStatus, OrderStatusColumn, OrderType, OrderTypeColumn } from '../order';
import { OrderItemsComponent } from '../order-items/order-items.component';
import { OrderItem } from '../orderItem';

@Component({
  selector: 'app-orders-list',
  templateUrl: './orders-list.component.html',
  styleUrls: ['./orders-list.component.scss']
})
export class OrdersListComponent implements OnInit {

  storage = { store: '', status: '', type: '' };
  type = extend(new OrderTypeColumn(
    {
      caption: 'סינון סוג',
      defaultValue: OrderType.all,
      valueChange: async () => {
        if (!this.loading) {
          await this.saveUserDefaults();
        }
        await this.refresh();
      }
    })).dataControl(x => {
      let v = [];
      for (const t of ValueListTypeInfo.get(OrderType).getOptions()) {
        if (t.isNormal()) {
          if (this.isTechnician()) {
            continue;
          }
        }
        v.push(t);
      }
      x.valueList = v;
    });
  status = new OrderStatusColumn(true, {
    caption: 'סינון סטטוס',
    valueChange: async () => {
      if (!this.loading) {
        await this.saveUserDefaults();
      }
      await this.refresh();
    }
  });
  store = extend(new UserId(this.context, Roles.store, {
    caption: this.isStore() ? 'בית קפה' : 'בית קפה',
    valueChange: async () => {
      if (!this.loading) {
        await this.saveUserDefaults();
      }
      await this.refresh();
    }
  }))
    .dataControl(it => {
      // it.cssClass = 'cfx-font-bold';
      it.hideDataOnInput = true;
      it.clickIcon = 'search';
      it.getValue = () => this.store.item.name;
      it.readOnly = () => this.isStore();
      it.click = async () => {
        await openDialog(DynamicServerSideSearchDialogComponent,
          dlg => dlg.args(Users, {
            onClear: () => this.store.value = '',
            onSelect: cur => this.store.value = cur.id.value,
            searchColumn: cur => cur.name,
            where: (cur) => cur.store.isEqualTo(true)
          })
        );
      };
    });
  count = new NumberColumn({ caption: 'מס.שורות' });

  orders: GridSettings<Order>;
  constructor(private context: Context, private dialog: DialogService) { }
  OrderType = OrderType;
  async ngOnInit() {
    await this.loadUserDefaults();
    await this.initGrid();
  }

  async initGrid() {
    this.orders = new GridSettings<Order>(this.context.for(Order),
      {
        where: row => {
          let result = FILTER_IGNORE;
          if (this.store.value) {
            result = result.and(row.sid.isEqualTo(this.store.value));
          }
          if (this.status.value) {
            result = result.and(row.status.isEqualTo(this.status.value));
          }
          if (this.type.value) {
            if (this.isTechnician()) {
              result = result.and(row.type.isIn(...OrderType.technicalTypes));
            }
            if (!this.type.isAll())
              result = result.and(row.type.isEqualTo(this.type.value));
          }

          // (this.isAdmin()
          //   ? this.store.value
          //     ? row.uid.isEqualTo(this.store.value)
          //     : FILTER_IGNORE
          //   : row.uid.isEqualTo(this.store.value))
          //   .and(this.status.value && this.status.isIn(OrderStatus.open, OrderStatus.closed)
          //     ? row.status.isEqualTo(this.status)
          //     : FILTER_IGNORE)
          //   .and(this.type.value && this.type.isIn(OrderType.normal, OrderType.fault, OrderType.maintenance)
          //     ? row.type.isEqualTo(this.type)
          //     : FILTER_IGNORE)

          return result;
        },
        // orderBy: cur => [cur.uid.item.name, { column: cur.orderNum, descending: true }],
        newRow: cur => {
          if (this.isStore()) {
            cur.sid.value = this.context.user.id;
          }
          else if (this.store.value) {
            cur.sid.value = this.store.value;
          }
          cur.date.value = addDays();
          cur.time.value = addTime();
          cur.status.value = OrderStatus.open;
        },
        allowCRUD: false,// this.context.isAllowed(Roles.admin),
        // allowDelete: false,
        numOfColumnsInGrid: 10,
        columnSettings: cur => [
          this.isStore() ? undefined : { column: cur.sid, readOnly: o => !o.isNew(), width: '95' },//, width: '95'
          { column: cur.date, readOnly: o => !o.isNew(), width: '90' },//
          { column: cur.orderNum, readOnly: o => !o.isNew(), width: '85', caption: this.isTechnician() ? 'מס.קריאה' : 'מס.הזמנה' },//
          { column: cur.type, readOnly: o => !o.isNew(), width: '80' },
          { column: cur.worker, caption: 'שם ממלא', readOnly: o => !o.isNew(), width: '100' }, //, width: '80' //this.isStore() ? undefined : { column: cur.worker, readOnly: o => !o.isNew(), width: '80' },
          { column: cur.status, readOnly: o => true, width: '80' },//, width: '80'
          { column: this.count, readOnly: o => true, width: '100', getValue: o => o.getCount(), hideDataOnInput: true, allowClick: (o) => false },//, width: '100'
          { column: cur.remark, readOnly: o => true },//, width: '100%'
          { column: cur.createdBy, readOnly: o => true }
        ],
        gridButtons: [
          {
            textInMenu: () => 'רענן',
            icon: 'refresh',
            click: async () => await this.refresh()
          }
        ],
        rowButtons: [
          {
            textInMenu: 'הצג פריטים',// row => row.type.isTechnical()? 'הצג קריאה' : 'הצג הזמנה',
            icon: 'shopping_bag',
            click: async (cur) => await this.showOrderItems(cur),
            visible: cur => !cur.isNew() && (this.isStore() ? cur.type.isNormal() : true),
            showInLine: true
          },
          {
            textInMenu: 'שכפל הזמנה',
            icon: 'content_copy',
            click: async (cur) => await this.copyOrder(cur),
            visible: cur => !cur.isNew() && (this.isAgent() || this.isStore())
          },
          {
            textInMenu: '__________________________',
            visible: cur => !cur.isNew() && cur.status.value === OrderStatus.open
          },
          {
            textInMenu: 'סגור הזמנה',
            icon: 'check_circle_outline',
            click: async (cur) => await this.closeOrder(cur),
            visible: cur => !cur.isNew() && cur.status.value === OrderStatus.open
          },
          {
            textInMenu: 'מחק הזמנה',
            icon: 'delete',
            click: async (cur) => await this.deleteOrder(cur),
            visible: cur => !cur.isNew() && cur.status.value === OrderStatus.open
          }
        ],
      });
  }


  loading = false;
  async loadUserDefaults() {
    if (this.isStore()) {
      this.loading = true;
      this.store.value = this.context.user.id;
      this.loading = false;
    }
    let defs = localStorage.getItem('user-defaults');
    if (defs) {
      this.storage = JSON.parse(defs);
      if (this.storage) {
        this.loading = true;
        if (!this.isStore()) {
          this.store.value = this.storage.store;
        }
        this.status.value = OrderStatus.fromString(this.storage.status);
        this.type.value = OrderType.fromString(this.storage.type);
        this.loading = false;
        // this.storage.status = this.status.value.caption;
        // this.storage.type = this.type.value.caption;
      }
    }
  }
  async saveUserDefaults() {
    this.storage.store = this.store.value;
    this.storage.status = this.status.value.id;
    this.storage.type = this.type.value.id;
    localStorage.setItem('user-defaults', JSON.stringify(this.storage));
  }

  async refresh() {
    if (this.orders) {
      await this.orders.reloadData();
    }
  }

  isStore() {
    return this.context.isAllowed(Roles.store);
  }
  isAdmin() {
    return this.context.isAllowed(Roles.admin);
  }
  isAgent() {
    return this.context.isAllowed(Roles.agent);
  }
  isTechnician() {
    return this.context.isAllowed(Roles.technician);
  }

  async closeOrder(o: Order) {
    let yes = await this.dialog.yesNoQuestion(`לסגור הזמנה ${o.orderNum.value}?`);
    if (yes) {
      o.status.value = OrderStatus.closed;
      await o.save();
      await this.refresh();
      await this.dialog.info(`הזמנה ${o.orderNum.value} נסגרה`);
    }
  }

  async addOrder(type: OrderType) {
    let order = this.context.for(Order).create();
    order.type.value = type;
    order.sid.value = this.isStore() ? this.context.user.id : this.store.value;
    order.date.value = addDays();
    let title = type.isTechnical() ? 'קריאת שירות חדשה' : 'הזמנה חדשה';
    await openDialog(InputAreaComponent,
      it => it.args = {
        title: title,
        columnSettings: () => {
          let f = [];
          if (!this.isStore()) {
            f.push(
              { column: order.sid, visible: () => this.store.value ? false : true, readOnly: () => this.isStore() },
            );
          }
          if (!(order.type.value === OrderType.normal)) {
            f.push(order.type);
          }
          f.push(
            order.date,
            { column: order.worker, visible: () => this.isStore(), readOnly: () => !this.isStore() },
            order.remark
          );
          return f;
        },
        ok: async () => {
          await order.save();
          if (!this.store.value) {
            this.store.value = order.sid.value;
          }
          await this.refresh();
          await this.showOrderItems(order, true);
        }
      });
    // this.orders.addNewRow();
  }

  async deleteOrder(o: Order) {
    let count = await this.context.for(OrderItem).count(cur => cur.oid.isEqualTo(o.id));
    if (count > 0) {
      await this.dialog.error(` נמצאו ${count} שורות, לא ניתן למחוק הזמנה זו`);
    }
    else {
      let yes = await this.dialog.confirmDelete(`הזמנה ${o.orderNum.value}`);
      if (yes) {
        await o.delete();
      }
      await this.dialog.info(`הזמנה ${o.orderNum.value} נמחקה`);
    }
  }

  async copyOrder(o: Order) {
    let yes = await this.dialog.yesNoQuestion(`האם לשכפל את הזמנה ${o.orderNum.value}`);
    if (yes) {
      let copy = this.context.for(Order).create();
      copy.sid.value = o.sid.value;
      copy.date.value = addDays();
      copy.time.value = addTime();
      copy.remark.value = o.remark.value;
      copy.worker.value = o.worker.value;
      copy.status.value = OrderStatus.open;
      await copy.save();
      for await (const oi of this.context.for(OrderItem).iterate({
        where: cur => cur.oid.isEqualTo(o.id)
      })) {
        let itm = this.context.for(OrderItem).create();
        // itm.upid.value = oi.upid.value;
        itm.oid.value = copy.id.value;
        itm.pid.value = oi.pid.value;
        itm.quntity.value = oi.quntity.value;
        // itm.remark.value = oi.remark.value;
        await itm.save();
      }
      await this.refresh();
      await this.showOrderItems(copy, true);
      await this.dialog.info(`הזמנה ${o.orderNum.value} שוכפלה`);
    }
  }

  async showOrderItems(o: Order, isNew = true) {
    let hide = this.isStore() && !o.type.isNormal();
    if (!hide) {
      let changed = await openDialog(OrderItemsComponent,
        it => it.args = { in: { sid: o.sid.value, oid: o.id.value, oType: o.type.value, oNum: o.orderNum.value, autoNew: isNew } },
        it => it && it.args.out ? it.args.out.changed : false);
      if (changed) {
        if (this.type.value === OrderType.all) {
          await this.refresh();
        }
        else {
          this.type.value = OrderType.all;//trigger refresh
        }
      }
    }
  }

}

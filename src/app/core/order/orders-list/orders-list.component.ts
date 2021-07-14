import { Component, OnInit } from '@angular/core';
import { extend, GridSettings, openDialog } from '@remult/angular';
import { Context, NumberColumn } from '@remult/core';
import { DialogService } from '../../../common/dialog';
import { DynamicServerSideSearchDialogComponent } from '../../../common/dynamic-server-side-search-dialog/dynamic-server-side-search-dialog.component';
import { GridDialogComponent } from '../../../common/grid-dialog/grid-dialog.component';
import { InputAreaComponent } from '../../../common/input-area/input-area.component';
import { FILTER_IGNORE } from '../../../shared/types';
import { addDays, addTime } from '../../../shared/utils';
import { Roles } from '../../../users/roles';
import { UserId, Users } from '../../../users/users';
import { Order, OrderStatus, OrderStatusColumn } from '../order';
import { OrderItemsComponent } from '../order-items/order-items.component';
import { OrderItem } from '../orderItem';

@Component({
  selector: 'app-orders-list',
  templateUrl: './orders-list.component.html',
  styleUrls: ['./orders-list.component.scss']
})
export class OrdersListComponent implements OnInit {

  status = new OrderStatusColumn(true, {
    caption: 'סינון לפי סטטוס הזמנה',
    valueChange: async () => {
      await this.refresh();
    }
  });
  store = extend(new UserId(this.context, Roles.store, {
    caption: 'בחירת בית קפה',
    valueChange: async () => {
      await this.saveUserDefaults();
      await this.refresh();
    }
  }))
    .dataControl(dcs => {
      dcs.hideDataOnInput = true;
      dcs.clickIcon = 'search';
      dcs.getValue = () => this.store.item.name;
      dcs.readOnly = () => this.isStore();
      dcs.click = async () => {
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
  orders = new GridSettings<Order>(this.context.for(Order),
    {
      where: cur => (this.isAdmin()
        ? this.store.value
          ? cur.uid.isEqualTo(this.store.value)
          : FILTER_IGNORE
        : cur.uid.isEqualTo(this.store.value))
        .and(this.status.value && this.status.isIn(OrderStatus.open, OrderStatus.closed)
          ? cur.status.isEqualTo(this.status)
          : FILTER_IGNORE),
      orderBy: cur => [cur.uid, { column: cur.orderNum, descending: true }],
      newRow: cur => {
        if (this.isStore()) {
          cur.uid.value = this.context.user.id;
        }
        else if (this.store.value) {
          cur.uid.value = this.store.value;
        }
        cur.date.value = addDays();
        cur.status.value = OrderStatus.open;
      },
      allowCRUD: false,// this.context.isAllowed(Roles.admin),
      // allowDelete: false,
      numOfColumnsInGrid: 10,
      columnSettings: cur => [
        this.isStore() ? undefined : { column: cur.uid, readOnly: o => !o.isNew(), width: '95' },
        { column: cur.date, readOnly: o => !o.isNew(), width: '80' },
        { column: cur.orderNum, readOnly: o => !o.isNew(), width: '80' },
        this.isStore() ? undefined : { column: cur.worker, readOnly: o => !o.isNew(), width: '80' },
        { column: this.count, readOnly: o => true, getValue: o => o.getCount(), hideDataOnInput: true, width: '100', allowClick: (o) => false },
        { column: cur.status, readOnly: o => true, width: '80' }
      ],
      rowButtons: [
        {
          textInMenu: 'הצג הזמנה',
          icon: 'shopping_bag',
          click: async (cur) => await this.showOrderItems(cur),
          visible: cur => !cur.isNew(),
          showInLine: true,
        },
        {
          textInMenu: 'שכפל הזמנה',
          icon: 'content_copy',
          click: async (cur) => await this.copyOrder(cur),
          visible: cur => !cur.isNew() && cur.status.value === OrderStatus.open && (this.isAgent() || this.isStore())
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

  constructor(private context: Context, private dialog: DialogService) { }

  async ngOnInit() {
    await this.loadUserDefaults();
  }

  async loadUserDefaults() {
    if (this.isStore()) {
      this.store.value = this.context.user.id;
    }
    else {
      let u = await this.context.for(Users).findId(this.context.user.id);
      if (u) {
        if (u.defaultStore.value) {
          let exists = await this.context.for(Users).findId(u.defaultStore.value);
          if (exists) {
            if (exists.store.value) {
              this.store.value = u.defaultStore.value;
            }
          }
        }
      }
    }
  }
  async saveUserDefaults() {
    if (!this.isStore()) {
      if (this.store.value) {
        let u = await this.context.for(Users).findId(this.context.user.id);
        u.defaultStore.value = this.store.value;
        await u.save();
      }
    }
  }

  async refresh() {
    await this.orders.reloadData();
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

  async closeOrder(o: Order) {
    let yes = await this.dialog.yesNoQuestion(`לסגור הזמנה ${o.orderNum.value}?`);
    if (yes) {
      o.status.value = OrderStatus.closed;
      await o.save();
      await this.refresh();
      await this.dialog.info(`הזמנה ${o.orderNum.value} נסגרה`);
    }
  }

  async addOrder() {
    let order = this.context.for(Order).create();
    order.uid.value = this.isStore() ? this.context.user.id : this.store.value;
    await openDialog(InputAreaComponent,
      it => it.args = {
        title: 'הזמנה חדשה',
        columnSettings: () => [
          { column: order.uid, visible: () => this.store.value ? false : true, readOnly: () => this.isStore() },
          order.date,
          { column: order.worker, visible: () => this.isStore(), readOnly: () => !this.isStore() }
        ],
        ok: async () => {
          await order.save();
          if (!this.store.value) {
            this.store.value = order.uid.value;
          }
          await this.refresh();
          await this.showOrderItems(order);
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
      copy.uid.value = o.uid.value;
      copy.date.value = addDays();
      copy.time.value = addTime();
      await copy.save();
      for await (const oi of this.context.for(OrderItem).iterate({
        where: cur => cur.oid.isEqualTo(o.id)
      })) {
        let itm = this.context.for(OrderItem).create();
        itm.upid.value = oi.upid.value;
        itm.oid.value = copy.id.value;
        itm.pid.value = oi.pid.value;
        itm.quntity.value = oi.quntity.value;
        await itm.save();
      }
      await this.showOrderItems(copy);
      await this.dialog.info(`הזמנה ${o.orderNum.value} שוכפלה`);
    }
  }

  async showOrderItems(o: Order) {
    let changed = await openDialog(OrderItemsComponent,
      it => it.args = { in: { oid: o.id.value } },
      it => it && it.args.out ? it.args.out.changed : false);
    if (changed) {
      await this.refresh();
    }
  }

}

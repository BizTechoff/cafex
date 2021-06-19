import { Component, OnInit } from '@angular/core';
import { GridSettings, openDialog } from '@remult/angular';
import { Context } from '@remult/core';
import { DialogService } from '../../../common/dialog';
import { GridDialogComponent } from '../../../common/grid-dialog/grid-dialog.component';
import { InputAreaComponent } from '../../../common/input-area/input-area.component';
import { addDays } from '../../../shared/utils';
import { Roles } from '../../../users/roles';
import { UserId, Users } from '../../../users/users';
import { Order } from '../../order/order';
import { OrderItem } from '../../order/orderItem';

@Component({
  selector: 'app-agent-store-orders',
  templateUrl: './agent-store-orders.component.html',
  styleUrls: ['./agent-store-orders.component.scss']
})
export class AgentStoreOrdersComponent implements OnInit {

  store = new UserId(this.context, Roles.store, { caption: 'בחר בית קפה', valueChange: async () => { await this.refresh(true); } });
  orders = new GridSettings(
    this.context.for(Order),
    { 
      where: cur => cur.uid.isEqualTo(this.store),
      orderBy: cur => [{ column: cur.orderNum, descending: true }],
      numOfColumnsInGrid: 10,
      allowCRUD: false,
      // allowDelete: false,
      showPagination: false,
      columnSettings: cur => [
        cur.date,
        cur.orderNum
        // { column: cur.date, width: '90' },
        // { column: cur.orderNum, width: '80' }//,
        // { column: cur.status, width: '90' }//,
        //{ column: new NumberColumn(), getValue: async (o) => { await this.context.for(OrderItem).count(itm => itm.oid.isEqualTo(o.id)) } }
      ],
      rowButtons: [
        {
          textInMenu: 'שורות הזמנה',
          icon: 'shopping_bag',
          click: async (cur) => { await this.openOrderItems(cur.id.value); }
        },
        { textInMenu: '__________________________' },
        {
          textInMenu: 'עריכת הזמנה',
          icon: 'edit',
          click: async (cur) => { await this.openOrder(cur.id.value); }
        },
        {
          textInMenu: 'מחק הזמנה',
          icon: 'delete',
          click: async (cur) => { await this.deleteOrder(cur.id.value); }
        }
      ]
    }
  )
  constructor(private context: Context, private dialog: DialogService) { }

  async ngOnInit() {
    let u = await this.context.for(Users).findId(this.context.user.id);
    if (u.defaultStore.value) {
      this.store.value = u.defaultStore.value;
    }
  }

  async refresh(changed = false) {
    if (changed) {
      let u = await this.context.for(Users).findId(this.context.user.id);
      u.defaultStore.value = this.store.value;
      await u.save();
    }
    await this.orders.reloadData();
  }

  async deleteOrder(oid?: string) {
    let order = await this.context.for(Order).findId(oid);
    if (order) {
      let num = order.orderNum.value;
      let sure = await this.dialog.confirmDelete(`הזמנה ${num} ל: ${this.store.item.name.value}`);
      if (sure) {
        await order.delete();
        await this.refresh();
        await this.dialog.info(`הזמנה ${num} נמחקה`);
      }
    }
    else {
      await this.dialog.error("הזמנה לא קיימת");
      console.log(`ERROR: AgentStoreOrdersComponent.deleteOrder(oid='${oid}') - Order Not Exists`);
    }
  }

  async openOrder(oid?: string) {
    if (this.store.item.id.value) {
      let order = this.context.for(Order).create();
      order.uid.value = this.store.item.id.value;
      order.date.value = addDays();
      if (oid) {
        order = await this.context.for(Order).findId(oid);
        if (!(order)) {
          this.dialog.error(`הזמנה ${oid} לא נמצאה`);
          return;
        }
      }
      if (order.isNew()) {
      }
      await openDialog(InputAreaComponent, thus => thus.args = {
        title: `הוספת הזמנה ל: ${this.store.item.name.value}`,
        columnSettings: () => [
          { column: order.orderNum, visible: () => { return order.orderNum.value > 0; } },
          order.date,
          // { column: order.isImported, readOnly: true }
        ],
        ok: async () => {
          await order.save();
          await this.refresh();
          //await order.reload();
        }
      });
    }
    else {
      this.dialog.error('יש לבחור בית קפה');
    }
  }

  async openOrderItems(oid?: string) {
    if (oid) {
      await openDialog(GridDialogComponent, dlg => dlg.args = {
        title: `שורות הזמנה`,
        settings: new GridSettings(this.context.for(OrderItem), {
          where: cur => cur.oid.isEqualTo(oid),
          newRow: (o) => {
            o.oid.value = oid;
          },
          allowCRUD: false,
          showPagination: false,
          numOfColumnsInGrid: 10,
          columnSettings: cur => [
            { column: cur.pid, width: '90' },
            { column: cur.quntity, width: '55' }//,
            // { column: cur.price, width: '50' }
          ],
          gridButtons: [
            {
              textInMenu: () => 'שורה חדשה',
              click: async () => {
                let changed = await this.openOrderItem(oid, '');
                if (changed) {
                  await dlg.args.settings.reloadData();
                }
              }
            }
          ],
          rowButtons: [{
            textInMenu: 'עריכת שורה',
            click: async (cur) => {
              let changed = await this.openOrderItem(oid, cur.id.value);
              if (changed) {
                await dlg.args.settings.reloadData();
              }
            }
          }]
        }),
        ok: () => { }
      })
    }
  }

  async openOrderItem(oid: string, oiid?: string) {
    let result = false;
    let item = this.context.for(OrderItem).create();
    item.oid.value = oid;
    if (oiid && oiid.length > 0) {
      item = await this.context.for(OrderItem).findId(oiid);
    }
    await openDialog(InputAreaComponent, thus => thus.args = {
      title: `${item.isNew() ? 'שורת הזמנה חדשה' : 'עריכת שורת הזמנה'}`,
      columnSettings: () => [
        { column: item.pid, width: '400' },
        item.quntity
      ],
      ok: async () => {
        await item.save();
        result = true;
        await this.refresh();
        //await order.reload();
      }
    });
    return result;
  }

}

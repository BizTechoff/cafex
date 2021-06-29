import { Component, OnInit } from '@angular/core';
import { GridSettings, openDialog } from '@remult/angular';
import { Context, NumberColumn } from '@remult/core';
import { DialogService } from '../../../common/dialog';
import { GridDialogComponent } from '../../../common/grid-dialog/grid-dialog.component';
import { addDays, addTime } from '../../../shared/utils';
import { Roles } from '../../../users/roles';
import { Order } from '../order';
import { OrderItem } from '../orderItem';

@Component({
  selector: 'app-orders-list',
  templateUrl: './orders-list.component.html',
  styleUrls: ['./orders-list.component.scss']
})
export class OrdersListComponent implements OnInit {

  count = new NumberColumn({ caption: 'מס.שורות' });
  orders = new GridSettings<Order>(this.context.for(Order),
    {
      orderBy: cur => [cur.uid, { column: cur.orderNum, descending: true }],
      newRow: cur => {
        cur.date.value = addDays();
      },
      allowCRUD: this.context.isAllowed(Roles.admin),
      allowDelete: false,
      numOfColumnsInGrid: 10,
      columnSettings: cur => [
        { column: cur.uid, readOnly: o => !o.isNew() },
        { column: cur.date, readOnly: o => !o.isNew() },
        { column: cur.orderNum, visible: o => !o.isNew() }
        // cur.date
        ,
        { column: this.count, getValue: o => o.getCount() }
        // {
        //   column: this.count, getValue: (o) => o.getCount(), visible: o => !o.isNew()
        // }
      ],
      rowButtons: [
        {
          textInMenu: 'שורות הזמנה',
          icon: 'shopping_bag',
          click: async (cur) => await this.showOrderItems(cur),
          visible: cur => !cur.isNew(),
          showInLine: true,
        },
        { textInMenu: '__________________________' },
        {
          textInMenu: 'מחק הזמנה',
          icon: 'delete',
          click: async (cur) => await this.deleteOrder(cur),
          visible: cur => !cur.isNew()
        }//,
        // {
        //   textInMenu: 'שכפל הזמנה',
        //   icon: 'content_copy',
        //   click: async (cur) => await this.copyOrder(cur),
        //   visible: cur => !cur.isNew()
        // }
      ],
    });

  constructor(private context: Context, private dialog: DialogService) { }

  ngOnInit() {
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
    }
  }

  async showOrderItems(o: Order) {
    await openDialog(GridDialogComponent, gd => gd.args = {
      title: `שורות הזמנה ${o.orderNum.value}`,
      settings: new GridSettings(this.context.for(OrderItem), {
        where: cur => cur.oid.isEqualTo(o.id),
        newRow: cur => cur.oid.value = o.id.value,
        allowCRUD: this.context.isSignedIn(),
        numOfColumnsInGrid: 10,
        columnSettings: cur => [
          { column: cur.pid, width: '400' },
          { column: cur.quntity, width: '70' }
          // cur.price
        ],
      }),
      ok: () => { }
    })
  }

}

import { Component, OnInit } from '@angular/core';
import { GridSettings, openDialog } from '@remult/angular';
import { Context, NumberColumn } from '@remult/core';
import { DialogService } from '../../../common/dialog';
import { GridDialogComponent } from '../../../common/grid-dialog/grid-dialog.component';
import { Order } from '../order';
import { OrderItem } from '../orderItem';

@Component({
  selector: 'app-orders-list',
  templateUrl: './orders-list.component.html',
  styleUrls: ['./orders-list.component.scss']
})
export class OrdersListComponent implements OnInit {

  count = new NumberColumn();
  orders = new GridSettings(this.context.for(Order),
    {
      orderBy: cur => cur.uid,
      allowCRUD: false,
      allowDelete: false,
      numOfColumnsInGrid: 10,
      columnSettings: cur => [
        cur.uid,
        cur.orderNum,
        cur.date,
        cur.time,
        // // cur.created,
        // cur.modified,
        // cur.modifiedBy,
        {
          column: this.count, caption: 'מס.מוצרים', getValue: () => cur.getCount()
        },
        cur.createdBy,
        cur.isImported
      ],
      rowButtons: [
        {
          textInMenu: 'הצג שורות',
          icon: 'shopping_bag',
          click: async (cur) => await this.showOrderItems(cur),
          visible: cur => !cur.isNew(),
          showInLine: true,
        },
        {
          textInMenu: 'מחק הזמנה',
          icon: 'delete',
          click: async (cur) => await this.deleteOrder(cur),
          visible: cur => !cur.isNew()
        }
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

  async showOrderItems(o: Order) {
    await openDialog(GridDialogComponent, gd => gd.args = {
      title: `שורות הזמנה ${o.orderNum.value}`,
      settings: new GridSettings(this.context.for(OrderItem), {
        where: cur => cur.oid.isEqualTo(o.id),
        newRow: cur => cur.oid.value = o.id.value,
        allowCRUD: this.context.isSignedIn(),
        numOfColumnsInGrid: 10,
        columnSettings: cur => [
          cur.pid,
          cur.quntity,
          cur.price
        ],
      }),
      ok: () => { }
    })
  }

}

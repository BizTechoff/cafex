import { Component, OnInit } from '@angular/core';
import { GridSettings, openDialog } from '@remult/angular';
import { Context } from '@remult/core';
import { DialogService } from '../../../common/dialog';
import { GridDialogComponent } from '../../../common/grid-dialog/grid-dialog.component';
import { sharedParams, TODAY } from '../../../shared/types';
import { addDays, addTime } from '../../../shared/utils';
import { Order } from '../../order/order';
import { OrderItem } from '../../order/orderItem';
import { rootParams } from '../../params/root-params/rootParams';

@Component({
  selector: 'app-store-orders',
  templateUrl: './store-orders.component.html',
  styleUrls: ['./store-orders.component.scss']
})
export class StoreOrdersComponent implements OnInit {
  params = new rootParams();
  orders = new GridSettings(this.context.for(Order),
    {
      // where: cur => cur.date.isEqualTo(this.params.date),
      orderBy: cur => [{column: cur.orderNum, descending : true}],
      newRow: cur => {
        cur.uid.value = this.context.user.id;
        cur.date.value = addDays();
      },
      allowCRUD: this.context.isSignedIn(),
      allowDelete: false,
      numOfColumnsInGrid: 10,
      columnSettings: cur => [
        cur.date,
        cur.orderNum
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
          textInMenu: 'שכפל הזמנה',
          icon: 'content_copy',
          click: async (cur) => await this.copyOrder(cur),
          visible: cur => !cur.isNew()
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
    // sharedParams.date.value = addDays();
  }

  async resfresh(){
    await this.orders.reloadData();
  }

  prevDay() {
    this.params.date.value = addDays(-1, this.params.date.value);
  }
  nextDay() {
    this.params.date.value = addDays(+1, this.params.date.value);
  }

  async addOrder() {
    let order = this.context.for(Order).create();

  }

  async copyOrder(o: Order) {
    let yes = await this.dialog.yesNoQuestion(`האם לשכפל את הזמנה ${o.orderNum.value}`);
    if (yes) {
      let copy = this.context.for(Order).create();
      copy.uid.value = o.uid.value;
      let d = addDays();
      copy.date.value = d;
      // console.log(d);
      // console.log(copy.date.value);
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
      await this.resfresh();
      await this.showOrderItems(copy);
    }
  }

  async deleteOrder(o: Order) {
    let count = await this.context.for(OrderItem).count(cur => cur.oid.isEqualTo(o.id));
    if (count > 0) {
      await this.dialog.error(` נמצאו ${count} שורות, לא ניתן למחוק הזמנה`);
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
          { column: cur.pid, width: '400' },
          cur.quntity//,
          // cur.price
        ],
      }),
      ok: () => { }
    })
  }

}

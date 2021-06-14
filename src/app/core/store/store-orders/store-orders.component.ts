import { Component, OnInit } from '@angular/core';
import { GridSettings, openDialog } from '@remult/angular';
import { Context } from '@remult/core';
import { DialogService } from '../../../common/dialog';
import { GridDialogComponent } from '../../../common/grid-dialog/grid-dialog.component';
import { sharedParams, TODAY } from '../../../shared/types';
import { addDays } from '../../../shared/utils';
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
      where: cur => cur.date.isEqualTo(this.params.date),
      allowCRUD: this.context.isSignedIn(),
      allowDelete: false,
      numOfColumnsInGrid: 10,
      columnSettings: cur => [
        cur.date,
      ],
      rowButtons: [
        {
          textInMenu: 'Show Details',
          icon: 'detials',
          click: async (cur) => await this.showOrderItems(cur),
          visible: cur => !cur.isNew(),
          showInLine: true,
        },
        {
          textInMenu: 'Delete Order',
          icon: 'delete',
          click: async (cur) => await this.deleteOrder(cur),
          visible: cur => !cur.isNew()
        }
      ],
    });

  constructor(private context: Context, private dialog: DialogService) { }

  ngOnInit() {
    // sharedParams.date.value = addDays(TODAY);
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

  async deleteOrder(o: Order) {
    let count = await this.context.for(OrderItem).count(cur => cur.oid.isEqualTo(o.id));
    if (count > 0) {
      await this.dialog.error(` Found ${count} OrderItems, Can NOT delete order`);
    }
    else {
      let yes = await this.dialog.confirmDelete(` ${o.orderNum.value} Order`);
      if (yes) {
        await o.delete();
      }
    }
  }

  async showOrderItems(o: Order) {
    await openDialog(GridDialogComponent, gd => gd.args = {
      title: `Detaild For Order ${o.date.value}`,
      settings: new GridSettings(this.context.for(OrderItem), {
        where: cur => cur.oid.isEqualTo(o.id),
        newRow: cur => cur.oid.value = o.id.value,
        allowCRUD: this.context.isSignedIn(),
        numOfColumnsInGrid: 10,
        columnSettings: cur => [
          cur.name,
          // cur.quntity,
          // cur.price
        ],
      }),
      ok: () => { }
    })
  }

}

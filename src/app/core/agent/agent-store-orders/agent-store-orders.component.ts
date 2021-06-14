import { Component, OnInit } from '@angular/core';
import { DataAreaSettings, GridSettings, openDialog } from '@remult/angular';
import { Context } from '@remult/core';
import { DialogService } from '../../../common/dialog';
import { InputAreaComponent } from '../../../common/input-area/input-area.component';
import { addDays } from '../../../shared/utils';
import { Order } from '../../order/order';
import { StoreIdColumn } from '../../store/store';

@Component({
  selector: 'app-agent-store-orders',
  templateUrl: './agent-store-orders.component.html',
  styleUrls: ['./agent-store-orders.component.scss']
})
export class AgentStoreOrdersComponent implements OnInit {

  store = new StoreIdColumn(this.context, { caption: 'Select Store', valueChange: async () => { await this.refresh(); } });
  orders = new GridSettings(
    this.context.for(Order),
    {
      where: cur => cur.sid.isEqualTo(this.store.value),
      numOfColumnsInGrid: 10,
      allowCRUD: false,
      allowDelete: false,
      showPagination: false,
      columnSettings: cur => [
        { column: cur.date, width: '90' },
        { column: cur.orderNum, width: '110' },
        cur.status],
      rowButtons: [
        {
          textInMenu: 'Edit Order',
          icon: 'edit',
          click: async (cur) => { await this.openOrder(cur.id.value); }
        },
        {
          textInMenu: 'Delete Order',
          icon: 'delete',
          click: async (cur) => { await this.deleteOrder(cur.id.value); }
        }
      ]
    }
  )
  constructor(private context: Context, private dialog: DialogService) { }

  ngOnInit() {
  }

  async refresh() {
    await this.orders.reloadData();
  }

  async deleteOrder(oid?: string) {
    let sure = await this.dialog.confirmDelete(`Order For ${this.store.item.name.value}`);
    if (sure) {
      let order = await this.context.for(Order).findId(oid);
      if (order) {
        await order.delete();
      }
      else {
        await this.dialog.error("Order Not Exists");
        console.log(`ERROR: AgentStoreOrdersComponent.deleteOrder(oid='${oid}') - Order Not Exists`);
      }
    }
  }

  async openOrder(oid?: string) {
    if (this.store.item.id.value) {
      let order = this.context.for(Order).create();
      order.sid.value = this.store.item.id.value;
      order.date.value = addDays();
      if (oid) {
        order = await this.context.for(Order).findId(oid);
        if (!(order)) {
          this.dialog.error(`Order ${oid} NOT found`);
          return;
        }
      }
      if (order.isNew()) {
      }
      await openDialog(InputAreaComponent, thus => thus.args = {
        title: `Add Order To ${this.store.item.name.value}`,
        columnSettings: () => [
          order.orderNum,
          order.date,
          { column: order.isImported, readOnly: true }
        ],
        ok: async () => {
          await order.save();
          await this.refresh();
          //await order.reload();
        }
      });
    }
    else {
      this.dialog.error('Please select store first');
    }
  }

}

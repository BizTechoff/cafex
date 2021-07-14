import { Component, OnInit } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { GridSettings, openDialog } from '@remult/angular';
import { Context } from '@remult/core';
import { DialogService } from '../../../common/dialog';
import { InputAreaComponent } from '../../../common/input-area/input-area.component';
import { Order, OrderStatus } from '../order';
import { OrderItem } from '../orderItem';

@Component({
  selector: 'app-order-items',
  templateUrl: './order-items.component.html',
  styleUrls: ['./order-items.component.scss']
})
export class OrderItemsComponent implements OnInit {

  args: { in: { oid: string }, out?: { changed: boolean } } = { in: { oid: '' }, out: { changed: false } };
  readonly = false;
  orderNum = 0;

  orderItems = new GridSettings(this.context.for(OrderItem),
    {
      where: cur => cur.oid.isEqualTo(this.args.in.oid),
      newRow: cur => cur.oid.value = this.args.in.oid,
      allowCRUD: false,
      numOfColumnsInGrid: 10,
      columnSettings: cur => [
        { column: cur.pid, width: '200', readOnly: this.readonly },
        { column: cur.quntity, width: '70', readOnly: this.readonly }
      ],
      rowButtons: [
        {
          textInMenu: 'מחק שורה',
          visible: () => !this.readonly,
          click: async (cur) => await this.deleteOrderItem(cur)
        }
      ]
    });

  constructor(private context: Context, private dialog: DialogService, private dialogRef: MatDialogRef<any>) { }

  async ngOnInit() {
    this.args.out = { changed: false };
    if (this.args.in.oid && this.args.in.oid.length > 0) {
      let o = await this.context.for(Order).findId(this.args.in.oid);
      if (o) {
        this.readonly = o.status.value === OrderStatus.closed;
        console.log('this.readonly='+this.readonly);
        this.orderNum = o.orderNum.value;

        if (!this.readonly) {
          let count = await this.context.for(OrderItem).count(cur => cur.oid.isEqualTo(o.id));
          if (count === 0) {
            let changed = await this.addOrderItem();
            if (changed) {
              await this.refresh();
            }
          }
        }
      }
    }
  }

  async refresh() {
    await this.orderItems.reloadData();
  }

  close(){
    this.dialogRef.close();
  }

  async addOrderItem() {
    let oi = this.context.for(OrderItem).create();
    oi.oid.value = this.args.in.oid;
    let ok = await openDialog(InputAreaComponent,
      it => it.args = {
        title: `הוספת מוצר להזמנה ${this.orderNum}`,
        columnSettings: () => [oi.pid, oi.quntity],
        ok: async () => {
          await oi.save();
          this.args.out.changed = true;
          await this.refresh();
        }
      },
      it => it ? it.ok : false);
    return ok;
  }

  async deleteOrderItem(oi: OrderItem) {
    let yes = await this.dialog.confirmDelete(`השורה הזו מההזמנה`);
    if (yes) {
      await oi.delete();
      await this.refresh();
      await this.dialog.info(`שורת ההזמנה נמחקה`);
    }
  }
}


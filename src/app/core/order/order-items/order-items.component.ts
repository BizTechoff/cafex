import { Component, OnInit } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { GridSettings, openDialog } from '@remult/angular';
import { Context } from '@remult/core';
import { DialogService } from '../../../common/dialog';
import { InputAreaComponent } from '../../../common/input-area/input-area.component';
import { Roles } from '../../../users/roles';
import { Order, OrderStatus } from '../order';
import { OrderItem } from '../orderItem';

@Component({
  selector: 'app-order-items',
  templateUrl: './order-items.component.html',
  styleUrls: ['./order-items.component.scss']
})
export class OrderItemsComponent implements OnInit {

  args: { in: { oid: string, oNum: number, autoNew: boolean }, out?: { changed: boolean } } = { in: { oid: '', oNum: 0, autoNew: false }, out: { changed: false } };
  readonly = true;
  orderNum = 0;

  orderItems = new GridSettings(this.context.for(OrderItem),
    {
      where: cur => cur.oid.isEqualTo(this.args.in.oid),
      newRow: cur => cur.oid.value = this.args.in.oid,
      allowCRUD: false,
      numOfColumnsInGrid: 10,
      columnSettings: cur => [
        { column: cur.pid, width: '170', readOnly: this.readonly },
        { column: cur.quntity, width: '70', readOnly: this.readonly },
        { column: cur.remark, readOnly: this.readonly }
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
        // console.log('this.readonly='+this.readonly);
        this.orderNum = o.orderNum.value;

        if (!this.readonly && this.args.in.autoNew) {
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

  isTechnician() {
    return this.context.isAllowed(Roles.technician);
  }

  async refresh() {
    await this.orderItems.reloadData();
  }

  close() {
    this.dialogRef.close();
  }

  async addOrderItem() {
    let add = this.context.for(OrderItem).create();
    add.oid.value = this.args.in.oid;
    let ok = await openDialog(InputAreaComponent,
      it => it.args = { 
        title: this.isTechnician() ? `הוספת פריט לקריאת שירות  ${this.orderNum}`: `הוספת פריט להזמנה  ${this.orderNum}`,
        columnSettings: () => [add.pid, add.quntity, add.remark],
        ok: async () => {
          await add.save();
          this.args.out.changed = true;
          await this.refresh();
        }
      },
      it => it ? it.ok : false);
    return ok;
  }

  async deleteOrderItem(oi: OrderItem) {
    let yes = await this.dialog.confirmDelete(`הפריט הזה מההזמנה`);
    if (yes) {
      await oi.delete();
      this.args.out.changed = true;
      await this.refresh();
      await this.dialog.info(`פריט נמחק`);
    }
  }
}


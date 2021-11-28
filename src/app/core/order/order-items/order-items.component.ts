import { Component, OnInit } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { GridSettings, openDialog } from '@remult/angular';
import { Context } from '@remult/core';
import { DialogService } from '../../../common/dialog';
import { InputAreaComponent } from '../../../common/input-area/input-area.component';
import { FILTER_IGNORE } from '../../../shared/types';
import { Roles } from '../../../users/roles';
import { Container } from '../../container/container';
import { ContainerItem } from '../../container/containerItem';
import { Order, OrderStatus, OrderType } from '../order';
import { OrderItem } from '../orderItem';

@Component({
  selector: 'app-order-items',
  templateUrl: './order-items.component.html',
  styleUrls: ['./order-items.component.scss']
})
export class OrderItemsComponent implements OnInit {

  args: { in: { uid: string, oid: string, oType: OrderType, oNum: number, autoNew: boolean }, out?: { changed: boolean } } = { in: { uid: '', oid: '', oType: OrderType.normal, oNum: 0, autoNew: false }, out: { changed: false } };
  readonly = true;
  orderNum = 0;
  containerError = '';
  order: Order;

  orderItems = new GridSettings<OrderItem>(this.context.for(OrderItem),
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
          textInMenu: 'פרטי שורה',
          icon: 'edit',
          visible: () => !this.readonly && this.isContaierExists(),
          click: async (cur) => await this.addOrderItem(cur)
        },
        {
          textInMenu: 'מחק שורה',
          icon: 'delete',
          visible: () => !this.readonly && this.isContaierExists(),
          click: async (cur) => await this.deleteOrderItem(cur)
        }
      ]
    });

  constructor(private context: Context, private dialog: DialogService, private dialogRef: MatDialogRef<any>) { }

  async ngOnInit() {
    this.args.out = { changed: false };

    if (this.args.in.uid && this.args.in.uid.length > 0) {
      await this.containerExistsWithProducts(
        this.args.in.uid);
    }
    if (this.args.in.oid && this.args.in.oid.length > 0) {
      this.order = await this.context.for(Order).findId(this.args.in.oid);
      if (this.order) {
        this.readonly = this.order.status.value === OrderStatus.closed;
        // console.log('this.readonly='+this.readonly);
        this.orderNum = this.order.orderNum.value;

        // console.log('this.readonly=' + this.readonly);
        // console.log('this.args.in.autoNew=' + this.args.in.autoNew);
        if (!this.readonly && this.args.in.autoNew && this.isContaierExists()) {
          let count = await this.context.for(OrderItem).count(cur => cur.oid.isEqualTo(this.order.id));
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

  getTitle() {
    let result = 'פרטי הזמנה';
    if (this.args.in.oType && this.args.in.oType.isTechnical()) {
      result = 'פרטי קריאה';
    }
    return result;
  }

  close() {
    this.dialogRef.close();
  }

  isContaierExists() {
    return !(this.containerError && this.containerError.length > 0)!;
  }

  async containerExistsWithProducts(uid: string /*order-uid*/) {
    let result = false;
    let con: Container;
    let items: ContainerItem[];
    // 1. Check at store container
    if (uid) {
      console.log(1, uid);

      con = await this.context.for(Container).findFirst({
        where: row => row.uid.isEqualTo(uid)
      });
      if (con) {
        console.log(2);

        items = await this.context.for(ContainerItem).find({
          where: row => row.conid.isEqualTo(con.id)
        });
      }
    }
    if (items && items.length > 0) {
      console.log(3);

      result = true;
    }
    else {
      console.log(4, this.context.user.id);

      // 2. Check at user(technical) container
      con = await this.context.for(Container).findFirst({
        where: row => row.uid.isEqualTo(this.context.user.id)
      });
      if (con) {
        console.log(6);

        items = await this.context.for(ContainerItem).find({
          where: row => row.conid.isEqualTo(con.id)
        });
        if (items && items.length > 0) {
          console.log(7);

          result = true;
        }
        else {
          console.log(8);

          this.containerError = 'לא נמצאו פריטים במחסן, לא ניתן להוסיף פריטים';
        }
      }
      else {
        console.log(9);

        this.containerError = 'לא נמצא מחסן, לא ניתן להוסיף פריטים';
      }
    }
    console.log(10);

    return result;
  }

  async addOrderItem(itm?: OrderItem) {
    let result = false;
    let title = this.isTechnician() ? `עדכון פריט לקריאת שירות  ${this.orderNum}` : `עדכון פריט להזמנה  ${this.orderNum}`;
    if (!itm) {
      itm = this.context.for(OrderItem).create();
      itm.oid.value = this.args.in.oid;
      title = this.isTechnician() ? `הוספת פריט לקריאת שירות  ${this.orderNum}` : `הוספת פריט להזמנה  ${this.orderNum}`;
    }

    // if (this.isTechnician()) {// the items are only technical-items
    //   let storeTechnialItems = [] as string[];
    //   let userTechnialItems = [] as string[];
    //   let all = storeTechnialItems U userTechnialItems;
    //   let productsToSelectFrom = get from product where id isIn(all);
    // }


    result = await openDialog(InputAreaComponent,
      it => it.args = {
        title: title,
        columnSettings: () => [itm.pid, itm.quntity, itm.remark],
        validate: async () => {
          await this.updateContainer(itm, true);
        },
        ok: async () => {
          await itm.save();
          this.args.out.changed = true;
          await this.updateContainer(itm, false);
          await this.refresh();
        }
      },
      it => it ? it.ok : false);
    return result;
  }

  async updateContainer(itm: OrderItem, validate = false) {
    let order = await this.context.for(Order).findId(itm.oid);
    if (order.type.isTechnical()) {
      let container = await this.context.for(Container).findFirst({
        where: row => {
          let result = FILTER_IGNORE;
          result = result.and(row.uid.isEqualTo(order.uid));
          return result;
        }
      });
      if (container) {
        let conItm = await this.context.for(ContainerItem).findFirst({
          where: row => {
            let result = FILTER_IGNORE;
            result = result.and(row.conid.isEqualTo(container.id));
            result = result.and(row.pid.isEqualTo(itm.pid));
            return result;
          }
        })
        if (conItm) {
          if (validate) {
            if (conItm.quantity < itm.quntity) {
              itm.quntity.validationError = `כמות שנשארה במחסן: ${conItm.quantity}`;
              throw itm.quntity.validationError;
            }
          }
          else {
            conItm.quantity.value -= itm.quntity.value;
            await conItm.save();
          }
        }
        else {
          if (validate) {
            itm.pid.validationError = `לא נמצא פריט כזה במחסן של החנות הזו שמשוייך אליך`;
            throw itm.pid.validationError;
          }
        }
      }
      else {
        if (validate) {
          itm.pid.validationError = `לא נמצא מחסן לחנות זו שמשוייך אליך`;
          throw itm.pid.validationError;
        }
      }
    }
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


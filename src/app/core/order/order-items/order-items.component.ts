import { Component, OnInit } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { GridSettings, openDialog } from '@remult/angular';
import { Context } from '@remult/core';
import { DialogService } from '../../../common/dialog';
import { DynamicServerSideSearchDialogComponent } from '../../../common/dynamic-server-side-search-dialog/dynamic-server-side-search-dialog.component';
import { InputAreaComponent } from '../../../common/input-area/input-area.component';
import { Roles } from '../../../users/roles';
import { UserProduct } from '../../../users/userProduct/userProduct';
import { Container, ContainerOwner } from '../../container/container';
import { ContainerItem } from '../../container/containerItem';
import { Product, ProductSharing, ProductType } from '../../product/product';
import { Order, OrderType } from '../order';
import { OrderItem } from '../orderItem';

@Component({
  selector: 'app-order-items',
  templateUrl: './order-items.component.html',
  styleUrls: ['./order-items.component.scss']
})
export class OrderItemsComponent implements OnInit {

  args: { in: { sid: string/*store*/, oid: string, oType: OrderType, oNum: number, autoNew: boolean }, out?: { changed: boolean } } = { in: { sid: '', oid: '', oType: OrderType.normal, oNum: 0, autoNew: false }, out: { changed: false } };
  readonly = true;
  orderNum = 0;
  order: Order;

  orderItems: GridSettings<OrderItem>;

  loaded = false;
  constructor(private context: Context, private dialog: DialogService, private dialogRef: MatDialogRef<any>) { }

  ContainerOwner = ContainerOwner;

  async ngOnInit() {
    this.args.out = { changed: false };
    this.initGrid();
    await this.refresh();
    this.loaded = true;
  }

  async initGrid() {
    this.orderItems = new GridSettings<OrderItem>(this.context.for(OrderItem),
      {
        where: row => row.oid.isEqualTo(this.args.in.oid),
        newRow: row => row.oid.value = this.args.in.oid,
        allowCRUD: false,
        numOfColumnsInGrid: 10,
        columnSettings: cur => [
          { column: cur.pid, width: '170', readOnly: this.readonly },
          { column: cur.quntity, width: '70', readOnly: this.readonly },
          { column: cur.remark, readOnly: this.readonly }
        ],
        gridButtons: [
          {
            textInMenu: () => 'רענן',
            icon: 'refresh',
            click: async () => await this.refresh()
          }
        ],
        rowButtons: [
          {
            textInMenu: 'פרטי שורה',
            icon: 'edit',
            visible: () => !this.readonly && !this.order.type.isTechnical(),
            click: async (cur) => await this.addOrderItem(cur)
          },
          {
            textInMenu: 'מחק שורה',
            icon: 'delete',
            visible: () => !this.readonly && (this.order.type.isTechnical() && this.isTechnician()),
            click: async (cur) => await this.deleteOrderItem(cur)
          }
        ]
      });
  }

  isTechnician() {
    return this.context.isAllowed(Roles.technician);
  }

  isStore() {
    return this.context.isAllowed(Roles.store);
  }

  async refresh() {
    if (this.args.in.oid && this.args.in.oid.length > 0) {
      this.order = await this.context.for(Order).findId(this.args.in.oid);

      if (this.order) {
        this.readonly = this.order.status.value.isClosed();
        this.orderNum = this.order.orderNum.value;
      }
    }

    await this.orderItems.reloadData();
  }

  getTitle() {
    let result = 'פרטי הזמנה';
    if (this.args.in.oType && this.args.in.oType.isTechnical()) {
      result = 'פרטי קריאה';
    }
    result += ` ${this.args.in.oNum}`
    return result;
  }

  close() {
    this.dialogRef.close();
  }

  async addOrderItem(itm?: OrderItem, owner?: ContainerOwner) {
    let result = false;
    let title = this.order.type.isTechnical() ? `עדכון פריט לקריאת שירות  ${this.orderNum}` : `עדכון פריט להזמנה  ${this.orderNum}`;
    if (!itm) {
      itm = this.context.for(OrderItem).create();
      itm.oid.value = this.args.in.oid;
      title = this.order.type.isTechnical() ? `הוספת פריט לקריאת שירות  ${this.orderNum}` : `הוספת פריט להזמנה  ${this.orderNum}`;
    }
    result = await openDialog(InputAreaComponent,
      it => it.args = {
        title: title,
        columnSettings: () => [
          {
            column: itm.pid,
            click: async () => {

              if (this.order.type.isNormal()) {
                if (this.isStore()) {
                  if (this.order.sid) {
                    await this.showStoreProucts(itm, this.order.sid.value)
                  }
                  else {
                    this.dialog.info('לא שוייך בית קפה להזמנה')
                  }
                }
              }

              else if (this.order.type.isTechnical()) {
                if (this.isTechnician()) {
                  if (this.order.technical) {
                    await this.showTechnicalProucts(itm, this.order.technical.value)
                  }
                  else {
                    this.dialog.info('לא שוייך טכנאי לקריאת השירות')
                  }

                }
              }
            }
          },
          itm.quntity,
          itm.remark],
        ok: async () => {
          await itm.save();
          this.args.out.changed = true;

          if (this.isTechnician() && this.order.type.isTechnical()) {
            await this.updateContainer(itm, -itm.quntity.value)
          }
          await this.refresh();
        }
      },
      it => it ? it.ok : false);
    return result;
  }

  async deleteOrderItem(itm: OrderItem) {
    let yes = await this.dialog.confirmDelete(`הפריט הזה מההזמנה`);
    if (yes) {
      await itm.delete();
      this.args.out.changed = true;
      await this.refresh();
      if (this.isTechnician() && this.order.type.isTechnical()) {
        await this.updateContainer(itm, itm.quntity.value)
      }
      await this.dialog.info(`פריט נמחק`);
    }
  }

  async showStoreProucts(clicked: OrderItem, sid: string) {
    let pids = await this.getUserProducts(sid)
    await openDialog(DynamicServerSideSearchDialogComponent,
      it => it.args(Product, {
        onClear: () => clicked.pid.value = '',
        onSelect: row => clicked.pid.value = row.id.value,
        searchColumn: row => row.name,
        where: row => row.active.isEqualTo(true)
          .and(row.type.isEqualTo(ProductType.regular))
          .and(row.share.isEqualTo(ProductSharing.public)
            .or(row.id.isIn(...pids)))
      })
    );
  }

  async showTechnicalProucts(itm: OrderItem, tid: string) {
    let pids = await this.getUserContainerProducts(tid)
    await openDialog(DynamicServerSideSearchDialogComponent,
      it => it.args(Product, {
        onClear: () => itm.pid.value = '',
        onSelect: row => itm.pid.value = row.id.value,
        searchColumn: row => row.name,
        where: row => row.active.isEqualTo(true)
          .and(row.type.isEqualTo(ProductType.technical))
          .and(row.share.isEqualTo(ProductSharing.public)
            .or(row.id.isIn(...pids)))
      })
    );
  }

  async getUserContainerProducts(uid: string) {
    let result: string[] = [] as string[];
    let con = await this.context.for(Container).findFirst({ where: row => row.uid.isEqualTo(uid) });
    if (con) {
      for await (const itm of this.context.for(ContainerItem).iterate({
        where: row => row.conid.isEqualTo(con.id)
      })) {
        result.push(itm.pid.value);
      }
    }
    else {
      this.dialog.info('לא הוקם לך מחסן')
    }
    return result;
  }

  async getUserProducts(uid: string) {
    let result: string[] = [] as string[];
    for await (const up of this.context.for(UserProduct).iterate({
      where: row => row.uid.isEqualTo(uid)
      // .and(row.pid.item.active.isEqualTo(true))
    })) {
      result.push(up.pid.value);
    }
    return result;
  }

  async updateContainer(itm: OrderItem, add = 0) {
    if (add !== 0) {
      if (this.isTechnician() && this.order.type.isTechnical()) {
        let tid = this.order.technical.value
        let con = await this.context.for(Container).findFirst(row => row.uid.isEqualTo(tid))
        if (!con) {
          con = this.context.for(Container).create()
          con.uid.value = tid
          if (this.order.technical.item) {
            con.name.value = 'הוקם ע"י ' + this.order.technical.item.name.value
          }
           if (this.order.sid.item) {
            con.name.value = 'הוקם ע"י ' + this.order.sid.item.name.value
          }
          await con.save()
        }
        let conItem = await this.context.for(ContainerItem).findFirst(
          row => row.conid.isEqualTo(con.id)
            .and(row.pid.isEqualTo(itm.pid)))
        if (!conItem) {
          conItem = this.context.for(ContainerItem).create()
          conItem.conid.value = con.id.value
          conItem.pid.value = itm.pid.value
        }
        if (!conItem.quantity.value) {
          conItem.quantity.value = 0
        }
        // console.log(`conItem.quantity.value + add = ${conItem.quantity.value} + ${add} = ${conItem.quantity.value + add}`)
        conItem.quantity.value += add
        if (conItem.quantity.value === 0) {
          await conItem.delete()
        }
        else {
          await conItem.save()
        }
      }
    }
  }

}

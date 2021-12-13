import { Component, OnInit } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { GridSettings, openDialog } from '@remult/angular';
import { Context } from '@remult/core';
import { DialogService } from '../../../common/dialog';
import { DynamicServerSideSearchDialogComponent } from '../../../common/dynamic-server-side-search-dialog/dynamic-server-side-search-dialog.component';
import { InputAreaComponent } from '../../../common/input-area/input-area.component';
import { FILTER_IGNORE } from '../../../shared/types';
import { Roles } from '../../../users/roles';
import { UserProduct } from '../../../users/userProduct/userProduct';
import { Container, ContainerOwner } from '../../container/container';
import { ContainerItem } from '../../container/containerItem';
import { Product } from '../../product/product';
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
  containerError = null!;
  order: Order;

  orderItems: GridSettings<OrderItem>;

  loaded = false;
  containerStore: Container;
  containerTech: Container;
  selectedContainetItem: ContainerItem;
  containerOwner = ContainerOwner.store;
  constructor(private context: Context, private dialog: DialogService, private dialogRef: MatDialogRef<any>) { }

  ContainerOwner = ContainerOwner;

  async ngOnInit() {
    this.args.out = { changed: false };
    this.initGrid();
    await this.refresh();
    // console.log(1);

    if (this.isTechnician()) {
      // console.log(2);
      await this.checkContainerIfExistsWithProducts();
      // console.log(3);
    }
    else{
      this.containerError = '';
    }
    this.loaded = true;

    // if (!this.readonly && this.args.in.autoNew && this.isContaierExists()) {
    //   // console.log(4);
    //   let count = await this.context.for(OrderItem).count(cur => cur.oid.isEqualTo(this.args.in.oid));
    //   if (count === 0) {
    //     let changed = await this.addOrderItem();
    //     if (changed) {
    //       await this.refresh();
    //     }
    //   }
    // }
    // console.log(5);
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
  }

  isTechnician() {
    return this.context.isAllowed(Roles.technician);
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

    if (this.order.type.isTechnical()) {
      if (this.args.in.sid && this.args.in.sid.length > 0) {
        console.log(this.containerStore);
        this.containerStore = await this.context.for(Container).findFirst({ where: row => row.uid.isEqualTo(this.args.in.sid) });
        console.log(this.args.in.sid, this.containerStore);
      }

      if (this.isTechnician()) {
        console.log(this.containerTech);
        this.containerTech = await this.context.for(Container).findFirst({ where: row => row.uid.isEqualTo(this.context.user.id) });
        console.log(this.context.user.id, this.containerTech);
      }
    }
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

  async checkContainerIfExistsWithProducts() {
    if (!this.containerStore && !this.containerTech) {
      this.containerError = 'לא נמצא מחסן לבית הקפה או לך';
      return false;
    }
    if (this.containerStore) {
      let items = await this.context.for(ContainerItem).find({
        where: row => row.conid.isEqualTo(this.containerStore.id)
      });
      if (!items || items.length == 0) {
        if (this.containerTech) {
          items = await this.context.for(ContainerItem).find({
            where: row => row.conid.isEqualTo(this.containerTech.id)
          });
          if (!items || items.length == 0) {
            this.containerError = 'לא נמצאו פריטים במחסן של בית הקפה ולא בשלך';
            return false;
          }
        }
      }
    }
    else if (this.containerTech) {
      let items = await this.context.for(ContainerItem).find({
        where: row => row.conid.isEqualTo(this.containerTech.id)
      });
      if (!items || items.length == 0) {
        this.containerError = 'לא נמצא מחסן בבית הקפה ובשלך לא נמצאו פריטים';
        return false;
      }
    }
    this.containerError = '';
    return true;
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
              let pids = [] as string[];
              if (!this.order.sid.item) {
                await this.order.sid.item.reload();
              }
              if (this.order.type.isTechnical()) {
                if (owner.isStore()) {
                  pids.push(...await this.getAllProductIdsFromContainer(this.order.sid.value));
                }
                else if (owner.isYours()) {
                  pids.push(...await this.getAllProductIdsFromContainer(this.context.user.id));
                }
              }
              else if (this.order.sid.value) {
                pids.push(...await this.getAllProductIdsFromStore(this.order.sid.value));
              }
              await openDialog(DynamicServerSideSearchDialogComponent,
                it => it.args(Product, {
                  onClear: () => itm.pid.value = '',
                  onSelect: row => itm.pid.value = row.id.value,
                  searchColumn: row => row.name,
                  where: row => row.id.isIn(...pids)
                })
              );
            }
          },
          itm.quntity,
          itm.remark],
        validate: async () => {
          if (this.order.type.isTechnical()) {
            await this.validateContainer(itm);
          }
        },
        ok: async () => {
          await itm.save();
          this.args.out.changed = true;

          if (this.isTechnician()) {
            if (this.selectedContainetItem) {
              this.selectedContainetItem.quantity.value -= itm.quntity.value;
              await this.selectedContainetItem.save();
            }
            else {
              console.log('this.selectedContainetItem is NULL');
            }
          }
          await this.refresh();
        }
      },
      it => it ? it.ok : false);
    return result;
  }

  async getAllProductIdsFromContainer(uid: string) {
    let result: string[] = [] as string[];
    let con = await this.context.for(Container).findFirst({
      where: row => row.uid.isEqualTo(uid)
    })
    if (con) {
      for await (const itm of this.context.for(ContainerItem).iterate({
        where: row => row.conid.isEqualTo(con.id)
      })) {
        result.push(itm.pid.value);
      }
    }
    return result;
  }

  async getAllProductIdsFromStore(uid: string) {
    let result: string[] = [] as string[];
    for await (const up of this.context.for(UserProduct).iterate({
      where: row => row.uid.isEqualTo(uid)
    })) {
      result.push(up.pid.value);
    }
    return result;
  }

  async showProductToSelect() {
    // ההזמנה
    let o = await this.context.for(Order).findId(this.args.in.oid);
    // מחסן של בית הקפה
    let con = await this.context.for(Container).findFirst({ where: row => row.uid.isEqualTo(o.sid) });
  }

  async validateContainer(itm: OrderItem, throwError = true) {
    let found = false;
    this.selectedContainetItem = null!;
    if (this.containerStore) {
      let conItm = await this.context.for(ContainerItem).findFirst({
        where: row => {
          let result = FILTER_IGNORE;
          result = result.and(row.conid.isEqualTo(this.containerStore.id));
          result = result.and(row.pid.isEqualTo(itm.pid));
          return result;
        }
      })
      if (conItm) {
        if (throwError) {
          if (conItm.quantity < itm.quntity) {
            itm.quntity.validationError = `כמות שנשארה במחסן: ${conItm.quantity}`;
            throw itm.quntity.validationError;
          }
        }
        this.selectedContainetItem = conItm;
        found = true;
      }
    }
    if (!found) {
      if (this.containerTech) {
        let conItm = await this.context.for(ContainerItem).findFirst({
          where: row => {
            let result = FILTER_IGNORE;
            result = result.and(row.conid.isEqualTo(this.containerTech.id));
            result = result.and(row.pid.isEqualTo(itm.pid));
            return result;
          }
        })
        if (conItm) {
          if (throwError)
            if (conItm.quantity < itm.quntity) {
              itm.quntity.validationError = `כמות שנשארה במחסן: ${conItm.quantity}`;
              throw itm.quntity.validationError;
            }
        }
        this.selectedContainetItem = conItm;
      }
    }
  }

  async getProductQunatity() { }

  async deleteOrderItem(oi: OrderItem) {
    let yes = await this.dialog.confirmDelete(`הפריט הזה מההזמנה`);
    if (yes) {
      await oi.delete();
      this.args.out.changed = true;
      await this.refresh();
      await this.validateContainer(oi, false);
      if (this.selectedContainetItem) {
        this.selectedContainetItem.quantity.value += oi.quntity.value;
        await this.selectedContainetItem.save();
      }
      else {
        if (!this.containerStore) {
          this.containerStore = this.context.for(Container).create();
          this.containerStore.id.value = this.args.in.sid;
          this.containerStore.name.value = 'מחסן של ' + this.order.sid.item.name.value;
          await this.containerStore.save();
        }
        let item = await this.context.for(ContainerItem).findFirst({ where: row => row.pid.isEqualTo(oi.pid) });
        if (!item) {
          item = this.context.for(ContainerItem).create();
          item.conid.value = this.containerStore.id.value;
          item.pid.value = oi.pid.value;
        }
        item.quantity.value += oi.quntity.value;
        await item.save();
        this.selectedContainetItem = item;
      }
      await this.dialog.info(`פריט נמחק`);
    }
  }
}



    // if (this.args.in.oType.isTechnical()) {
    //   if (this.args.in.sid && this.args.in.sid.length > 0) {
    //     await this.setContainerIfExistsWithProducts(
    //       this.args.in.sid);
    //   }
    // }
    // if (this.args.in.oid && this.args.in.oid.length > 0) {
    //   this.order = await this.context.for(Order).findId(this.args.in.oid);
    //   if (this.order) {
    //     this.readonly = this.order.status.value === OrderStatus.closed;
    //     // console.log('this.readonly='+this.readonly);
    //     this.orderNum = this.order.orderNum.value;

    //     // console.log('this.readonly=' + this.readonly);
    //     // console.log('this.args.in.autoNew=' + this.args.in.autoNew);
    //     if (!this.readonly && this.args.in.autoNew && this.isContaierExists()) {
    //       let count = await this.context.for(OrderItem).count(cur => cur.oid.isEqualTo(this.order.id));
    //       if (count === 0) {
    //         let changed = await this.addOrderItem();
    //         if (changed) {
    //           await this.refresh();
    //         }
    //       }
    //     }
    //   }
    // }

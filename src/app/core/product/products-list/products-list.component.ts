import { Component, OnInit } from '@angular/core';
import { GridSettings, openDialog } from '@remult/angular';
import { Context, NumberColumn, StringColumn } from '@remult/core';
import { DialogService } from '../../../common/dialog';
import { GridDialogComponent } from '../../../common/grid-dialog/grid-dialog.component';
import { InputAreaComponent } from '../../../common/input-area/input-area.component';
import { FILTER_IGNORE } from '../../../shared/types';
import { Roles } from '../../../users/roles';
import { UserProduct } from '../../../users/userProduct/userProduct';
import { OrderItem } from '../../order/orderItem';
import { Product } from '../product';
import { ProductUsersComponent } from '../product-users/product-users.component';

@Component({
  selector: 'app-products-list',
  templateUrl: './products-list.component.html',
  styleUrls: ['./products-list.component.scss']
})
export class ProductsListComponent implements OnInit {

  count = new NumberColumn({ caption: 'משוייכים' });
  search = new StringColumn({
    caption: 'חיפוש לפי שם מוצר',
    valueChange: async () => await this.refresh()
  });
  products = new GridSettings<Product>(this.context.for(Product),
    {
      where: cur => this.search.value && this.search.value.length > 0
        ? cur.name.contains(this.search.value)
        : FILTER_IGNORE,
      orderBy: cur => [cur.cid, cur.ciid, cur.sku, cur.name],
      allowCRUD: false,
      allowDelete: false,
      numOfColumnsInGrid: 10,
      columnSettings: cur => [
        cur.type,
        cur.cid,
        cur.ciid,
        cur.sku,
        cur.name,
        { column: this.count, readOnly: o => true, getValue: c => c.getCount(), hideDataOnInput: true, width: '85', allowClick: (c) => false },
        cur.share,
        cur.active
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
          textInMenu: 'משתמשים משוייכים',
          icon: 'shopping_bag',//await this.showProducts(this.context.user.id, this.context.user.name)
          click: async (cur) => await this.showUsers(cur.id.value, cur.name.value),
          visible: cur => !cur.isNew(),
          showInLine: true,
        },
        { textInMenu: '________________________' },
        {
          textInMenu: 'ערוך פריט',
          icon: 'edit',
          click: async (cur) => await this.editOrAddProduct(cur.id.value),
          visible: cur => !cur.isNew()
        },
        {
          textInMenu: 'מחק פריט',
          icon: 'delete',
          click: async (cur) => await this.deleteProduct(cur.id.value),
          visible: cur => !cur.isNew()
        }
      ],
    });
  constructor(private context: Context, private dialog: DialogService) { }

  ngOnInit() {
  }

  async refresh() {
    await this.products.reloadData();
  }

  async editOrAddProduct(pid: string = '') {
    let p = await this.context.for(Product).findOrCreate(cur => cur.id.isEqualTo(pid));
    let changed = await openDialog(InputAreaComponent,
      it => it.args = {
        title: p.isNew() ? `פריט חדש` : `עריכת פריט: ${p.name.value}`,
        columnSettings: () => [
          p.active,
          p.type,
          p.cid,
          p.ciid,
          p.sku,
          p.name,
          p.share
        ],
        ok: async () => {
          await p.save();
          await this.refresh();
          //await order.reload();
        }
      },
      it => it ? it.ok : false);
    if (changed) {
    }
  }

  async deleteProduct(pid: string) {
    let count = await this.context.for(OrderItem).count(cur => cur.pid.isEqualTo(pid));
    if (count > 0) {
      await this.dialog.error(` נמצאו ${count} שורות להזמנה, לא ניתן למחוק פריט זה`);
    }
    else {
      let p = await this.context.for(Product).findId(pid);
      if (p) {
        let yes = await this.dialog.confirmDelete(` פריט ${p.name.value}`);
        if (yes) {
          await p.delete();
          await this.refresh();
        }
      }
    }
  }

  async showUsers(pid: string, name?: string) {

    let changed = await openDialog(ProductUsersComponent,
      it => it.args = { in: { pid: pid, name: name } },
      it => it && it.args.out ? it.args.out.changed : false);
    if (changed) {
      await this.refresh();
    }
    // await openDialog(GridDialogComponent, gd => gd.args = {
    //   title: `משתמשים משוייכים ל- ${name}`,
    //   settings: new GridSettings(this.context.for(UserProduct), {
    //     where: cur => cur.pid.isEqualTo(pid),
    //     newRow: cur => cur.pid.value = pid,
    //     allowCRUD: this.context.isSignedIn(),
    //     numOfColumnsInGrid: 10,
    //     columnSettings: cur => [
    //       { column: cur.uid }
    //     ]
    //   }),
    //   ok: () => { }
    // })
  }

}

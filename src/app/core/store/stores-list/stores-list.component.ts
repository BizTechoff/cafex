import { Component, OnInit } from '@angular/core';
import { GridSettings, openDialog } from '@remult/angular';
import { Context, NumberColumn } from '@remult/core';
import { DialogService } from '../../../common/dialog';
import { GridDialogComponent } from '../../../common/grid-dialog/grid-dialog.component';
import { WIDTH_COLUMN_SHORT, WIDTH_COLUMN_SHORT_MINUS } from '../../../shared/types';
import { Roles } from '../../../users/roles';
import { UserProductsComponent } from '../../../users/userProduct/user-products/user-products.component';
import { UserProduct } from '../../../users/userProduct/userProduct';
import { Users } from '../../../users/users';

@Component({
  selector: 'app-stores-list',
  templateUrl: './stores-list.component.html',
  styleUrls: ['./stores-list.component.scss']
})
export class StoresListComponent implements OnInit {

  count = new NumberColumn({ caption: 'מוצרים' });
  stores = new GridSettings<Users>(this.context.for(Users), {
    where: cur => cur.store.isIn(true),
    orderBy: cur => cur.name,
    newRow: cur => cur.store.value = true,
    allowCRUD: this.context.isAllowed(Roles.admin),
    allowDelete: false,
    numOfColumnsInGrid: 10,
    columnSettings: cur => [
      { column: cur.name, width: WIDTH_COLUMN_SHORT },
      { column: this.count, getValue: u => u.getCount(), width: WIDTH_COLUMN_SHORT_MINUS, hideDataOnInput: true }
    ],
    rowButtons: [
      {
        textInMenu: 'מוצרים משוייכים',
        icon: 'shopping_bag',//await this.showProducts(this.context.user.id, this.context.user.name)
        click: async (cur) => await this.showProducts(cur.id.value, cur.name.value),
        visible: cur => !cur.isNew(),
        showInLine: true,
      },
      {
        textInMenu: 'מחק בית קפה',
        icon: 'delete',
        click: async (cur) => await this.deleteStore(cur),
        visible: cur => !cur.isNew()
      }
    ],
  });

  constructor(private context: Context, private dialog: DialogService) { }

  ngOnInit() {
  }

  async resfresh() {
    await this.stores.reloadData();
  }

  async deleteStore(u: Users) {
    let count = await this.context.for(UserProduct).count(cur => cur.uid.isEqualTo(u.id));
    if (count > 0) {
      await this.dialog.error(` נמצאו ${count} מוצרים, לא ניתן למחוק בית קפה זה`);
    }
    else {
      let yes = await this.dialog.confirmDelete(`בית הקפה ${u.name.value}`);
      if (yes) {
        await u.delete();
      }
    }
  }

  async showProducts(uid: string, name?: string) {
    if (name && name.length > 0 ? false : true) {
      name = 'אינשם';
    }
    let changed = await openDialog(UserProductsComponent,
      it => it.args = { in: { uid: uid, name: name } },
      it => it ? it.args.out.changed : false);
    if (changed) {
      await this.resfresh();
    }
  }

}

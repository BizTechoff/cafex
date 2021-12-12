import { Component, OnInit } from '@angular/core';
import { GridSettings, openDialog } from '@remult/angular';
import { Context, NumberColumn, StringColumn } from '@remult/core';
import { DialogService } from '../../../common/dialog';
import { InputAreaComponent } from '../../../common/input-area/input-area.component';
import { FILTER_IGNORE, WIDTH_COLUMN_SHORT, WIDTH_COLUMN_SHORT_MINUS } from '../../../shared/types';
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

  search = new StringColumn({
    caption: 'חיפוש לפי שם בית קפה',
    valueChange: async () => await this.refresh()
  });
  count = new NumberColumn({ caption: 'פריטים' });
  stores = new GridSettings<Users>(this.context.for(Users), {
    where: cur => cur.store.isEqualTo(true)//only stores
      .and(this.search.value && this.search.value.length > 0
        ? cur.name.contains(this.search.value) : FILTER_IGNORE),
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
        textInMenu: 'פריטים משוייכים',
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

  async refresh() {
    await this.stores.reloadData();
  }
  
  async editOrAddStore(uid: string = ''){
    let u = await this.context.for(Users).findOrCreate(cur => cur.id.isEqualTo(uid));
    u.store.value = true;
    let changed = await openDialog(InputAreaComponent,
      it => it.args = {
        title: u.isNew() ? `בית קפה חדש` : `עריכת בית קפה: ${u.name.value}`,
        columnSettings: () => [
          u.name
        ], 
        ok: async () => {
          // await u.create();
          await this.refresh();
          //await order.reload();
        }
      },
      it => it ? it.ok : false);
    if (changed) {
    }
  }

  async deleteStore(u: Users) {
    let count = await this.context.for(UserProduct).count(cur => cur.uid.isEqualTo(u.id));
    if (count > 0) {
      await this.dialog.error(` נמצאו ${count} פריטים, לא ניתן למחוק בית קפה זה`);
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
      it => it && it.args.out ? it.args.out.changed : false);
    if (changed) {
      await this.refresh();
    }
  }

}

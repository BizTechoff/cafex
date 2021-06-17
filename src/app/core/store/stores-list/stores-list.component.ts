import { Component, OnInit } from '@angular/core';
import { GridSettings, openDialog } from '@remult/angular';
import { Context } from '@remult/core';
import { DialogService } from '../../../common/dialog';
import { GridDialogComponent } from '../../../common/grid-dialog/grid-dialog.component';
import { Roles } from '../../../users/roles';
import { UserProduct } from '../../../users/userProduct';
import { Users } from '../../../users/users';

@Component({
  selector: 'app-stores-list',
  templateUrl: './stores-list.component.html',
  styleUrls: ['./stores-list.component.scss']
})
export class StoresListComponent implements OnInit {

  stores = new GridSettings(this.context.for(Users), {
    where: cur => cur.store.isIn(true),
    newRow: cur => cur.store.value = true,
    allowCRUD: this.context.isAllowed(Roles.admin),
    allowDelete: false,
    numOfColumnsInGrid: 10,
    columnSettings: cur => [
      cur.name,
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

  async deleteStore(u: Users) {
    let count = await this.context.for(UserProduct).count(cur => cur.uid.isEqualTo(u.id));
    if (count > 0) {
      await this.dialog.error(` נמצאו ${count} מוצרים, לא ניתן למחוק בית קפה זה`);
    }
    else {
      let yes = await this.dialog.confirmDelete(` ${u.name.value} Store`);
      if (yes) {
        await u.delete();
      }
    }
  }

  async showProducts(uid: string, name?: string) {
    if (!(name && name.length > 0)) {
      name = 'אינשם';
    }
    await openDialog(GridDialogComponent, gd => gd.args = {
      title: `מוצרים משוייכים ל- ${name}`,
      settings: new GridSettings(this.context.for(UserProduct), {
        where: cur => cur.uid.isEqualTo(uid),
        newRow: cur => cur.uid.value = uid,
        allowCRUD: this.context.isSignedIn(),
        numOfColumnsInGrid: 10,
        columnSettings: cur => [
          cur.pid
        ],
      }),
      ok: () => { }
    })
  }

}

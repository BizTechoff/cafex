import { Component, OnInit } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { GridSettings, openDialog } from '@remult/angular';
import { Context } from '@remult/core';
import { DialogService } from '../../../common/dialog';
import { InputAreaComponent } from '../../../common/input-area/input-area.component';
import { UserProduct } from '../../../users/userProduct/userProduct';
import { Users } from '../../../users/users';
import { Product } from '../product';

@Component({
  selector: 'app-product-users',
  templateUrl: './product-users.component.html',
  styleUrls: ['./product-users.component.scss']
})
export class ProductUsersComponent implements OnInit {

  args: { in: { pid: string, name: string }, out?: { changed: boolean } } = { in: { pid: '', name: '' } };
  readonly = false;

  users = new GridSettings(this.context.for(UserProduct), {
    where: cur => cur.cid.isEqualTo(this.args.in.pid),
    orderBy: cur => [cur.uid],
    newRow: cur => cur.cid.value = this.args.in.pid,
    allowCRUD: false,
    numOfColumnsInGrid: 10,
    columnSettings: cur => [
      { column: cur.uid, width: '222' }
    ],
    rowButtons: [
      {
        textInMenu: 'מחק שורה',
        visible: () => !this.readonly,
        click: async (cur) => await this.deleteUserProduct(cur)
      }
    ]
  });

  constructor(private context: Context, private dialog: DialogService, private dialogRef: MatDialogRef<any>) { }

  async ngOnInit() {
    if (!this.args) {
      throw 'לא צויין המוצר';
    }
    let p = await this.context.for(Product).findId(this.args.in.pid);
    if (!p) {
      throw 'לא נמצא המוצר';
    }
    this.args.out = { changed: false };
  }

  close() {
    this.dialogRef.close();
  }

  async refresh() {
    await this.users.reloadData();
  }

  async addUserProduct() {
    let add = this.context.for(UserProduct).create();
    add.cid.value = this.args.in.pid;
    let changed = await openDialog(InputAreaComponent,
      it => it.args = {
        title: 'בחר משתמש לשיוך',
        columnSettings: () => [add.uid],
        ok: async () => {
          await add.save();
          this.args.out.changed = true;
        }
      },
      it => it ? it.ok : false);
    if (changed) {
      await this.refresh();
    }
  }

  async deleteUserProduct(up: UserProduct) {
    let yes = await this.dialog.yesNoQuestion(`לבטל שיוך משתמש זה מ- ${this.args.in.name}`);
    if (yes) {
      await up.delete();
      await this.refresh();
      await this.dialog.info(`שיוך בוטל בהצלחה`);
    }
  }

}

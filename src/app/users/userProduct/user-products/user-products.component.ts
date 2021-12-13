import { Component, OnInit } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { GridSettings, openDialog } from '@remult/angular';
import { Context } from '@remult/core';
import { DialogService } from '../../../common/dialog';
import { InputAreaComponent } from '../../../common/input-area/input-area.component';
import { FILTER_IGNORE } from '../../../shared/types';
import { Users } from '../../users';
import { UserProduct } from '../userProduct';

@Component({
  selector: 'app-user-products',
  templateUrl: './user-products.component.html',
  styleUrls: ['./user-products.component.scss']
})
export class UserProductsComponent implements OnInit {

  args: { in: { uid: string, name: string }, out?: { changed: boolean } } = { in: { uid: '', name: '' } };
  readonly = false;

  products = new GridSettings(this.context.for(UserProduct), {
    where: row => {
      let result = FILTER_IGNORE;
      result = result.and(row.uid.isEqualTo(this.args.in.uid));
      return result;
    },
    newRow: cur => cur.uid.value = this.args.in.uid,
    allowCRUD: false,
    numOfColumnsInGrid: 10,
    columnSettings: cur => [
      { column: cur.pid, width: '250' }
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
        textInMenu: 'עריכת פריט',
        icon: 'edit',
        showInLine: true,
        visible: () => !this.readonly,
        click: async (row) => await this.addUserProduct(row.id.value)
      },
      {
        textInMenu: 'מחק שורה',
        icon: 'delete',
        visible: () => !this.readonly,
        click: async (row) => await this.deleteUserProduct(row)
      }
    ]
  });

  constructor(private context: Context, private dialog: DialogService, private dialogRef: MatDialogRef<any>) { }

  async ngOnInit() {
    if (!this.args) {
      throw 'לא צויין המשתמש';
    }
    let u = await this.context.for(Users).findId(this.args.in.uid);
    if (!u) {
      throw 'לא נמצא המשתמש';
    }
    this.args.out = { changed: false };
  }

  close() {
    this.dialogRef.close();
  }

  async refresh() {
    await this.products.reloadData();
  }

  async addUserProduct(upid?: string) {
    let add: UserProduct;
    if (upid && upid.length > 0) {
      add = await this.context.for(UserProduct).findId(upid);
      add.uid.value = this.args.in.uid;
    }
    else {
      add = this.context.for(UserProduct).create();
      add.uid.value = this.args.in.uid;
    }
    let changed = await openDialog(InputAreaComponent,
      it => it.args = {
        title: upid ? 'עריכת פריט שיוך' : 'הוספת פריט לשיוך',
        columnSettings: () => [{ column: add.pid, width: '' }],
        ok: async () => {
          await add.save();
          this.args.out.changed = true;
        }
      },
      it => it ? it.ok : false);
    if (changed) {
      await this.refresh();
    }
    // let yes = await this.dialog.yesNoQuestion('להוסיף פריט נוסף?');
    // if(yes){
    //   await this.addUserProduct();
    // }
  }

  async deleteUserProduct(up: UserProduct) {
    let yes = await this.dialog.yesNoQuestion(`לבטל שיוך פריט זה מ${this.args.in.name}`);
    if (yes) {
      await up.delete();
      await this.refresh();
      await this.dialog.info(`שיוך בוטל בהצלחה`);
    }
  }

}

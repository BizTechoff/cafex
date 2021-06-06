import { Component, OnInit } from '@angular/core';
import { GridSettings, openDialog } from '@remult/angular';
import { Context } from '@remult/core';
import { DialogService } from '../../../common/dialog';
import { GridDialogComponent } from '../../../common/grid-dialog/grid-dialog.component';
import { Product } from '../../product/product';
import { Store } from '../store';

@Component({
  selector: 'app-stores-list',
  templateUrl: './stores-list.component.html',
  styleUrls: ['./stores-list.component.scss']
})
export class StoresListComponent implements OnInit {

  stores = new GridSettings(this.context.for(Store),
    {
      allowCRUD: this.context.isSignedIn(),
      allowDelete: false,
      numOfColumnsInGrid: 10,
      columnSettings: cur => [
        cur.name,
      ],
      rowButtons: [
        {
          textInMenu: 'Show Products',
          icon: 'shopping_bag',
          click: async (cur) => await this.showProducts(cur),
          visible: cur => !cur.isNew(),
          showInLine: true,
        },
        {
          textInMenu: 'Delete Store',
          icon: 'delete',
          click: async (cur) => await this.deleteStore(cur),
          visible: cur => !cur.isNew()
        } 
      ],
    });

  constructor(private context: Context, private dialog: DialogService) { }

  ngOnInit() {
  }

  async deleteStore(s: Store) {
    let count = await this.context.for(Product).count(cur => cur.sid.isEqualTo(s.id));
    if (count > 0) {
      await this.dialog.error(` Found ${count} Products, Can NOT delete store`);
    }
    else {
      let yes = await this.dialog.confirmDelete(` ${s.name.value} Store`);
      if (yes) {
        await s.delete();
      }
    }
  }

  async showProducts(s: Store) {
    await openDialog(GridDialogComponent, gd => gd.args = {
      title: `Products For ${s.name.value}`,
      settings: new GridSettings(this.context.for(Product), {
        where: cur => cur.sid.isEqualTo(s.id),
        newRow: cur => cur.sid.value = s.id.value,
        allowCRUD: this.context.isSignedIn(),
        numOfColumnsInGrid: 10,
        columnSettings: cur => [
          cur.name,
          cur.quntity,
          cur.price
        ],
      }),
      ok: () => { }
    })
  }

}

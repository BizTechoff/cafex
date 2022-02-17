import { Component, OnInit } from '@angular/core';
import { BusyService, extend, GridSettings, openDialog } from '@remult/angular';
import { Context, ServerFunction, StringColumn } from '@remult/core';
import { DialogService } from '../common/dialog';
import { GridDialogComponent } from '../common/grid-dialog/grid-dialog.component';
import { InputAreaComponent } from '../common/input-area/input-area.component';
import { Container } from '../core/container/container';
import { Order } from '../core/order/order';
import { FILTER_IGNORE } from '../shared/types';
import { Roles } from './roles';
import { UserProduct } from './userProduct/userProduct';
import { Users } from './users';



@Component({
  selector: 'app-users',
  templateUrl: './users.component.html',
  styleUrls: ['./users.component.css']
})
export class UsersComponent implements OnInit {
  args: { out?: { changed: boolean } } = { out: { changed: false } };

  search = extend(new StringColumn({
    caption: 'חפש כאן שם משתמש',
    valueChange: () => this.busy.donotWait(async () => this.refresh())
  }))
    .dataControl(() => ({ clickIcon: 'search', click: async () => await this.refresh() }));


  constructor(private dialog: DialogService, public context: Context, private busy: BusyService) {
  }
  isAdmin() {
    return this.context.isAllowed(Roles.admin);
  }

  users = new GridSettings<Users>(this.context.for(Users), {
    where: cur => this.search.value ? cur.name.contains(this.search) : FILTER_IGNORE,
    allowDelete: false,
    allowUpdate: this.isAdmin(),
    allowInsert: false,
    numOfColumnsInGrid: 10,
    columnSettings: row => [
      { column: row.name, width: '85' },
      { column: row.admin, width: '70', readOnly: true, hideDataOnInput: false },
      { column: row.technician, width: '75', hideDataOnInput: false },
      { column: row.agent, width: '65', hideDataOnInput: true },
      { column: row.store, width: '95', hideDataOnInput: true }
    ],
    gridButtons: [
      {
        textInMenu: () => 'רענן',
        icon: 'refresh',
        click: async () => { await this.refresh(); }
      }
    ],
    rowButtons: [{
      cssClass: 'under-line',
      visible: row => row.store.value || row.technician.value,
      name: 'פריטים משוייכים',
      icon: 'shopping_bag',
      click: async (row) => await this.showProducts(row)
    }
      // ,{
      //   visible: row => row.store.value || row.technician.value,
      //   name: '_________________',
      //   icon: 'minimize'
      // } 
      , {
      name: 'איפוס סיסמא',
      icon: 'password',
      click: async () => {

        if (await this.dialog.yesNoQuestion("האם לאפס סיסמא ל " + this.users.currentRow.name.value)) {
          await UsersComponent.resetPassword(this.users.currentRow.id.value);
          this.dialog.info("סיסמא אופסה");
        };
      }
    }, {
      name: 'מחיקת משתמש',
      icon: 'delete',
      click: async (cur) => {
        let count = await this.context.for(Order).count(row => row.createdBy.isEqualTo(cur.id).or(row.modifiedBy.isEqualTo(cur.id)))
        if (count > 0) {
          this.dialog.error('לא ניתן למחוק משתמש המשוייך להזמנות')
          return
        } count = await this.context.for(Container).count(row => row.createdBy.isEqualTo(cur.id))
        if (count > 0) {
          this.dialog.error('לא ניתן למחוק משתמש המשוייך למחסן')
          return
        }
        if (await this.dialog.confirmDelete(cur.name.value)) {
          await cur.delete();
        };
      }
    }
    ]
  });

  async showProducts(u: Users) {
    /*
    select  * 
    from    usersproducts
    where 	uid = '9bd98773-51a8-4846-b56f-3bac02de7193'
              OR
            pid in (select id from products where share = 'public' and type = 'regular');
    */
    await openDialog(GridDialogComponent, gd => gd.args = {
      title: `פריטים המשוייכים ל: ${u.name.value}`,
      settings: new GridSettings(this.context.for(UserProduct), {
        where: row => row.uid.isEqualTo(u.id),
        // row.pid.item.active.isEqualTo(true)
        //   .and(row.uid.isEqualTo(u.id)
        //     .or(row.pid.item.share.isEqualTo(ProductSharing.public))),
        allowCRUD: false,
        numOfColumnsInGrid: 1,
        columnSettings: row => [
          { column: row.pid, width: '250' }
        ],
      }),
      ok: () => { }
    })
  }

  @ServerFunction({ allowed: Roles.admin })
  static async getDefaultPasswword() {
    return process.env.DEFAULT_PASSWORD;
  }

  @ServerFunction({ allowed: Roles.admin })
  static async resetPassword(userId: string, context?: Context) {
    let u = await context.for(Users).findId(userId);
    if (u) {
      u.password.hashAndSet(await UsersComponent.getDefaultPasswword());
      await u.save();
    }
  }

  ngOnInit() {
  }

  async refresh() {
    await this.users.reloadData();
  }

  async addUser() {
    let add = this.context.for(Users).create();
    add.store.value = true;
    let changed = await openDialog(InputAreaComponent,
      it => it.args = {
        title: 'הוספת משתמש חדש',
        columnSettings: () => [add.name, add.admin, add.technician, add.agent, add.store],
        ok: async () => {
          let pass = await UsersComponent.getDefaultPasswword();
          // console.log('pass='+pass);
          await add.create(pass);
          this.args.out.changed = true;
        }
      },
      it => it ? it.ok : false);
    if (changed) {
      await this.refresh();
    }
  }

}

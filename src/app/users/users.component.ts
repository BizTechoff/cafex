import { Component, OnInit } from '@angular/core';
import { BusyService, extend, GridSettings, openDialog } from '@remult/angular';
import { Context, ServerFunction, StringColumn } from '@remult/core';
import { DialogService } from '../common/dialog';
import { InputAreaComponent } from '../common/input-area/input-area.component';
import { FILTER_IGNORE } from '../shared/types';
import { Roles } from './roles';
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
    allowCRUD: false,
    numOfColumnsInGrid: 10,
    // get: { 
    //   orderBy: h => [h.name],
    //   limit: 100
    // },
    columnSettings: users => [
      { column: users.name, width: '80' },
      { column: users.admin, width: '70', hideDataOnInput: true },
      { column: users.technician, width: '75', hideDataOnInput: true },
      { column: users.agent, width: '65', hideDataOnInput: true },
      { column: users.store, width: '95', hideDataOnInput: true }
    ],
    rowButtons: [{
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

        if (await this.dialog.confirmDelete(cur.name.value)) {
          await cur.delete();
        };
      }
    }
    ]
  });

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
        columnSettings: () => [add.name],
        ok: async () => {
          let pass = await UsersComponent.getDefaultPasswword();
          console.log('pass='+pass);
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

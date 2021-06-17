import { Component, OnInit } from '@angular/core';
import { GridSettings } from '@remult/angular';
import { Context, ServerFunction } from '@remult/core';
import { DialogService } from '../common/dialog';
import { Roles } from './roles';
import { Users } from './users';



@Component({
  selector: 'app-users',
  templateUrl: './users.component.html',
  styleUrls: ['./users.component.css']
})
export class UsersComponent implements OnInit {
  constructor(private dialog: DialogService, public context: Context) {
  }
  isAdmin() {
    return this.context.isAllowed(Roles.admin);
  }

  users = new GridSettings(this.context.for(Users), {
    orderBy: cur => [
      { column: cur.admin, descending: true },
      { column: cur.technician, descending: true },
      { column: cur.agent, descending: true },
      { column: cur.store, descending: true },
      cur.name
    ],
    allowDelete: false,
    allowInsert: true,
    allowUpdate: true,
    numOfColumnsInGrid: 10,
    get: {
      orderBy: h => [h.name],
      limit: 100
    },
    columnSettings: users => [
      users.name,
      users.admin,
      users.technician,
      users.agent,
      users.store
    ],
    rowButtons: [{
      name: 'Reset Password',
      click: async () => {

        if (await this.dialog.yesNoQuestion("Are you sure you want to reset the password of " + this.users.currentRow.name.value)) {
          await UsersComponent.resetPassword(this.users.currentRow.id.value);
          this.dialog.info("Password reseted");
        };
      }
    }, {
      name: 'Delete User',
      click: async (cur) => {

        if (await this.dialog.confirmDelete(cur.name.value)) {
          await cur.delete();
        };
      }
    }
    ]
  });
  
  @ServerFunction({ allowed: Roles.admin })
  static async resetPassword(userId: string, context?: Context) {
    let u = await context.for(Users).findId(userId);
    if (u) {
      u.password.hashAndSet(process.env.DEFAULT_PASSWORD);
      await u.save();
    }
  }



  ngOnInit() {
  }

}

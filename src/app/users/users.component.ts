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

  users = new GridSettings<Users>(this.context.for(Users), {
    allowDelete: false,
    allowInsert: true,
    allowUpdate: true,
    numOfColumnsInGrid: 10,
    // get: {
    //   orderBy: h => [h.name],
    //   limit: 100
    // },
    columnSettings: users => [
      {column:users.name, width:'80'},
      {column:users.admin, width:'70'},
      {column:users.technician, width:'75'},
      {column:users.agent, width:'65'},
      {column:users.store, width:'95'}
    ],
    rowButtons: [{
      name: 'איפוס סיסמא',
      click: async () => {

        if (await this.dialog.yesNoQuestion("האם לאפס סיסמא ל " + this.users.currentRow.name.value)) {
          await UsersComponent.resetPassword(this.users.currentRow.id.value);
          this.dialog.info("סיסמא אופסה");
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

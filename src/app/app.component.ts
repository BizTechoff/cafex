import { Component, OnInit, ViewChild } from '@angular/core';
import { MatSidenav } from '@angular/material/sidenav';
import { ActivatedRoute, Route, Router } from '@angular/router';
import { JwtHelperService } from '@auth0/angular-jwt';
import { openDialog, RouteHelperService } from '@remult/angular';
import { Context, ServerFunction, StringColumn, UserInfo } from '@remult/core';
import { DialogService } from './common/dialog';
import { InputAreaComponent } from './common/input-area/input-area.component';
import { Roles } from './users/roles';
import { PasswordColumn, Users } from './users/users';



@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {

  appVersion = '2022.02.17.0'

  constructor( 
    public router: Router,
    public activeRoute: ActivatedRoute,
    private routeHelper: RouteHelperService,
    public dialogService: DialogService,
    public context: Context) {


  }

  async signIn() {
    let user = new StringColumn({ caption: "משתמש" });
    let password = new PasswordColumn();
    openDialog(InputAreaComponent, i => i.args = {
      title: 'פרטי כניסה',
      mainButtonText: 'כניסה',
      columnSettings: () => [
        user,
        password
      ],
      ok: async () => {
        if (user.value) {
          user.value = user.value.trim();//remult check if changed
        }
        this.setToken(await AppComponent.signIn(user.value, password.value));
        if (this.context.isAllowed(Roles.technician)) {
          this.router.navigateByUrl('t/orders')
        }
        else if (this.context.isAllowed(Roles.store)) {
          this.router.navigateByUrl('s/orders')
          // await this.router.navigateByUrl('s/orders')
          // await this.sidenav.toggle();
        }
      }
    });
  }
  @ServerFunction({ allowed: true })
  static async signIn(user: string, password: string, context?: Context) {
    let result: UserInfo;
    let u = await context.for(Users).findFirst(h => h.name.isEqualTo(user));
    if (u)
      if (await u.password.matches(password)) {
        result = {
          id: u.id.value,
          roles: [],
          name: u.name.value
        };
        if (u.admin.value) {
          result.roles.push(Roles.admin);//, Roles.technician);
        }
        if (u.technician.value) {
          result.roles.push(Roles.technician);
        }
        if (u.agent.value) {
          result.roles.push(Roles.agent);
        }
        if (u.store.value) {
          result.roles.push(Roles.store);
        }
      }

    if (result) {
      return (await import('jsonwebtoken')).sign(result, process.env.TOKEN_SIGN_KEY);
    }
    throw new Error("שגיאה בנתוני כניסה");
  }
  setToken(token: string) {
    if (token) {
      this.context.setUser(<UserInfo>new JwtHelperService().decodeToken(token));
      sessionStorage.setItem("auth_token", token);
    }
    else {
      this.context.setUser(undefined);
      sessionStorage.removeItem("auth_token");
    }
  }
  ngOnInit(): void {
    this.setToken(sessionStorage.getItem('auth_token'))
  }

  signOut() {
    this.setToken(undefined);
    this.router.navigate(['/']);
  }
  signUp() {
    let user = this.context.for(Users).create();
    let password = new PasswordColumn();
    let confirmPassword = new PasswordColumn({ caption: "אימות סיסמא" });
    openDialog(InputAreaComponent, i => i.args = {
      title: "רישום",
      columnSettings: () => [
        user.name,
        password,
        confirmPassword
      ],
      ok: async () => {
        if (password.value != confirmPassword.value) {
          confirmPassword.validationError = "סיסמאות לא תואמות";
          throw new Error(confirmPassword.defs.caption + " " + confirmPassword.validationError);
        }
        await user.create(password.value);
        this.setToken(await AppComponent.signIn(user.name.value, password.value));

      }
    });
  }

  openSite(url:string){
    window.open(url, '_blank')
  }
  
  async updateInfo() {
    let user = await this.context.for(Users).findId(this.context.user.id);
    openDialog(InputAreaComponent, i => i.args = {
      title: "פרטים אישיים",
      columnSettings: () => [
        user.name
      ],
      ok: async () => {
        await user.save();
      }
    });
  }
  async changePassword() {
    let user = await this.context.for(Users).findId(this.context.user.id);
    let password = new PasswordColumn();
    let confirmPassword = new PasswordColumn({ caption: "אימות סיסמא" });
    openDialog(InputAreaComponent, i => i.args = {
      title: "שנה סיסמא",
      columnSettings: () => [
        password,
        confirmPassword
      ],
      ok: async () => {
        if (password.value != confirmPassword.value) {
          confirmPassword.validationError = "סיסמאות לא תואמות";
          throw new Error(confirmPassword.defs.caption + " " + confirmPassword.validationError);
        }
        await user.updatePassword(password.value);
        await user.save();
      }
    });

  }

  routeName(route: Route) {
    let name = route.path;
    if (route.data && route.data.name)
      name = route.data.name;
    return name;
  }

  currentTitle() {
    if (this.activeRoute && this.activeRoute.snapshot && this.activeRoute.firstChild)
      if (this.activeRoute.firstChild.data && this.activeRoute.snapshot.firstChild.data.name) {
        return this.activeRoute.snapshot.firstChild.data.name;
      }
      else {
        if (this.activeRoute.firstChild.routeConfig)
          return this.activeRoute.firstChild.routeConfig.path;
      }
    return 'cafex-app';
  }

  shouldDisplayRoute(route: Route) {
    if (!(route.path && route.path.indexOf(':') < 0 && route.path.indexOf('**') < 0))
      return false;
    return this.routeHelper.canNavigateToRoute(route);
  }
  //@ts-ignore ignoring this to match angular 7 and 8
  @ViewChild('sidenav') sidenav: MatSidenav;
  routeClicked() {
    if (this.dialogService.isScreenSmall())
      this.sidenav.close();

  }


}

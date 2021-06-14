import {  RemultModule, NotSignedInGuard, SignedInGuard } from '@remult/angular';
import { NgModule, ErrorHandler } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { HomeComponent } from './home/home.component';


import { UsersComponent } from './users/users.component';
import { Roles, AdminGuard, StoreGuard, AgentGuard } from './users/roles';
import { ShowDialogOnErrorErrorHandler } from './common/dialog';
import { JwtModule } from '@auth0/angular-jwt';
import { StoresListComponent } from './core/store/stores-list/stores-list.component';
import { StoreOrdersComponent } from './core/store/store-orders/store-orders.component';
import { AgentStoreOrdersComponent } from './core/agent/agent-store-orders/agent-store-orders.component';
import { OrdersListComponent } from './core/order/orders-list/orders-list.component';
import { ProductsListComponent } from './core/product/products-list/products-list.component';


const routes: Routes = [
  { path: 'Home', component: HomeComponent, canActivate: [NotSignedInGuard] },
  { path: 'Orders', component: OrdersListComponent, canActivate: [AdminGuard] },
  { path: 'Stores', component: StoresListComponent, canActivate: [AdminGuard] },
  { path: 'Products', component: ProductsListComponent, canActivate: [AdminGuard] },
  { path: 's/orders', component: StoreOrdersComponent, canActivate: [StoreGuard], data: {name: 'Your`s Orders'} },
  { path: 'a/orders', component: AgentStoreOrdersComponent, canActivate: [AgentGuard], data: {name: 'Store Orders'} },
  { path: 'User Accounts', component: UsersComponent, canActivate: [AdminGuard] },
  { path: '', redirectTo: '/Home', pathMatch: 'full' },
  { path: '**', redirectTo: '/Home', pathMatch: 'full' }

];

@NgModule({
  imports: [RouterModule.forRoot(routes),
    RemultModule,
    JwtModule.forRoot({
      config: { tokenGetter: () => sessionStorage.getItem('auth_token') }
    })],
  providers: [AdminGuard, { provide: ErrorHandler, useClass: ShowDialogOnErrorErrorHandler }],
  exports: [RouterModule]
})
export class AppRoutingModule { }


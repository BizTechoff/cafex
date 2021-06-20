import { RemultModule, NotSignedInGuard } from '@remult/angular';
import { NgModule, ErrorHandler } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { HomeComponent } from './home/home.component';
import { UsersComponent } from './users/users.component';
import { AdminGuard, StoreGuard, AgentGuard, TechnicianGuard } from './users/roles';
import { ShowDialogOnErrorErrorHandler } from './common/dialog';
import { JwtModule } from '@auth0/angular-jwt';
import { StoresListComponent } from './core/store/stores-list/stores-list.component';
import { StoreOrdersComponent } from './core/store/store-orders/store-orders.component';
import { AgentStoreOrdersComponent } from './core/agent/agent-store-orders/agent-store-orders.component';
import { OrdersListComponent } from './core/order/orders-list/orders-list.component';
import { ProductsListComponent } from './core/product/products-list/products-list.component';
import { CategoriesListComponent } from './core/category/categories-list/categories-list.component';
import { CertificatesListComponent } from './core/certificate/certificates-list/certificates-list.component';

const routes: Routes = [
  { path: 'Home', component: HomeComponent, canActivate: [NotSignedInGuard], data: { name: 'ברוכים הבאים' } },
  { path: 'Orders', component: OrdersListComponent, canActivate: [AdminGuard], data: { name: 'הזמנות' } },
  { path: 'Certificates', component: CertificatesListComponent, canActivate: [AdminGuard], data: { name: 'תעודות' } },
  { path: 'Stores', component: StoresListComponent, canActivate: [AdminGuard], data: { name: 'בתי קפה' } },
  { path: 'Products', component: ProductsListComponent, canActivate: [AdminGuard], data: { name: 'מוצרים' } },
  { path: 'Categories', component: CategoriesListComponent, canActivate: [AdminGuard], data: { name: 'קטגוריות למוצרים' } },
  { path: 's/orders', component: StoreOrdersComponent, canActivate: [StoreGuard], data: { name: 'הזמנות' } },
  { path: 't/orders', component: AgentStoreOrdersComponent, canActivate: [TechnicianGuard], data: { name: 'הזמנות' } },
  { path: 'a/orders', component: AgentStoreOrdersComponent, canActivate: [AgentGuard], data: { name: 'הזמנות' } },
  { path: 'a/certificates', component: CertificatesListComponent, canActivate: [AgentGuard], data: { name: 'תעודות' } },
  { path: 'User Accounts', component: UsersComponent, canActivate: [AdminGuard], data: { name: 'משתמשים' } },
  { path: '', redirectTo: '/Home', pathMatch: 'full' },
  { path: '**', redirectTo: '/Home', pathMatch: 'full' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes),
    RemultModule,
  JwtModule.forRoot({
    config: { tokenGetter: () => sessionStorage.getItem('auth_token') }
  })],
  providers: [AdminGuard, StoreGuard, AgentGuard, TechnicianGuard, NotSignedInGuard, { provide: ErrorHandler, useClass: ShowDialogOnErrorErrorHandler }],
  exports: [RouterModule]
})
export class AppRoutingModule { }

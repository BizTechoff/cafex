import { RemultModule, NotSignedInGuard } from '@remult/angular';
import { NgModule, ErrorHandler } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { HomeComponent } from './home/home.component';
import { UsersComponent } from './users/users.component';
import { AdminGuard, StoreGuard, AgentGuard, TechnicianGuard, TechnicianOrAdminGuard } from './users/roles';
import { ShowDialogOnErrorErrorHandler } from './common/dialog';
import { JwtModule } from '@auth0/angular-jwt';
import { StoresListComponent } from './core/store/stores-list/stores-list.component';
import { OrdersListComponent } from './core/order/orders-list/orders-list.component';
import { ProductsListComponent } from './core/product/products-list/products-list.component';
import { CategoriesListComponent } from './core/category/categories-list/categories-list.component';
import { CertificatesListComponent } from './core/certificate/certificates-list/certificates-list.component';
import { AgentStoreCertificatesComponent } from './core/agent/agent-store-certificates/agent-store-certificates.component';
import { ContainersListComponent } from './core/container/containers-list/containers-list.component';

const routes: Routes = [
  { path: 'Home', component: HomeComponent, canActivate: [NotSignedInGuard], data: { name: 'ברוכים הבאים' } },
  { path: 'Orders', component: OrdersListComponent, canActivate: [AdminGuard], data: { name: 'הזמנות' } },
  { path: 'Certificates', component: CertificatesListComponent, canActivate: [AdminGuard], data: { name: 'תעודות' } },
  { path: 'Stores', component: StoresListComponent, canActivate: [AdminGuard], data: { name: 'בתי קפה' } },
  { path: 'Products', component: ProductsListComponent, canActivate: [AdminGuard], data: { name: 'פריטים' } },
  { path: 'Categories', component: CategoriesListComponent, canActivate: [AdminGuard], data: { name: 'קטגוריות לפריטים' } },
  // { path: 's/orders', component: StoreOrdersComponent, canActivate: [StoreGuard], data: { name: 'הזמנות' } },
  { path: 's/orders', component: OrdersListComponent, canActivate: [StoreGuard], data: { name: 'הזמנות' } },
  { path: 't/orders', component: OrdersListComponent, canActivate: [TechnicianGuard], data: { name: 'קריאות שירות' } },
  { path: 'a/orders', component: OrdersListComponent, canActivate: [AgentGuard], data: { name: 'הזמנות' } },
  { path: 't/containers', component: ContainersListComponent, canActivate: [TechnicianOrAdminGuard], data: { name: 'מחסנים' } },
  { path: 'a/certificates', component: AgentStoreCertificatesComponent, canActivate: [AgentGuard], data: { name: 'תעודות' } },
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

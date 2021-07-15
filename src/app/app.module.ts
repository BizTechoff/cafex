import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatListModule } from '@angular/material/list';
import { MatMenuModule } from '@angular/material/menu';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatToolbarModule } from '@angular/material/toolbar';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { RemultModule } from '@remult/angular';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { DialogService } from './common/dialog';
import { DynamicServerSideSearchDialogComponent } from './common/dynamic-server-side-search-dialog/dynamic-server-side-search-dialog.component';
import { GridDialogComponent } from './common/grid-dialog/grid-dialog.component';
import { InputAreaComponent } from './common/input-area/input-area.component';
import { YesNoQuestionComponent } from './common/yes-no-question/yes-no-question.component';
import { OrdersListComponent } from './core/order/orders-list/orders-list.component';
import { RootParamsComponent } from './core/params/root-params/root-params.component';
import { ProductsListComponent } from './core/product/products-list/products-list.component';
import { StoresListComponent } from './core/store/stores-list/stores-list.component';
import { HomeComponent } from './home/home.component';
import { AdminGuard, AgentGuard, StoreGuard, TechnicianGuard } from './users/roles';
import { UsersComponent } from './users/users.component';
import { CategoriesListComponent } from './core/category/categories-list/categories-list.component';
import { CategoryCrudComponent } from './core/category/category-crud/category-crud.component';
import { CertificatesListComponent } from './core/certificate/certificates-list/certificates-list.component';
import { CertificateCrudComponent } from './core/certificate/certificate-crud/certificate-crud.component';
import { AgentStoreCertificatesComponent } from './core/agent/agent-store-certificates/agent-store-certificates.component';
import { OrderItemsComponent } from './core/order/order-items/order-items.component';
import { UserProductsComponent } from './users/userProduct/user-products/user-products.component';
import { ProductUsersComponent } from './core/product/product-users/product-users.component';
import { CategoryItemsComponent } from './core/category/category-items/category-items.component';
 
 
@NgModule({
  declarations: [
    AppComponent,
    UsersComponent,
    HomeComponent,
    YesNoQuestionComponent,
    InputAreaComponent,
    GridDialogComponent,
    StoresListComponent,
    ProductsListComponent,
    OrdersListComponent,
    RootParamsComponent,
    DynamicServerSideSearchDialogComponent,
    CategoriesListComponent,
    CategoryCrudComponent,
    CertificatesListComponent,
    CertificateCrudComponent,
    AgentStoreCertificatesComponent,
    OrderItemsComponent,
    UserProductsComponent,
    ProductUsersComponent,
    CategoryItemsComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    FormsModule,
    MatSidenavModule,
    MatListModule,
    MatToolbarModule,
    MatCheckboxModule,
    MatCardModule,
    MatDialogModule,
    MatSnackBarModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    RemultModule,
    BrowserAnimationsModule
  ],
  providers: [DialogService, AdminGuard, TechnicianGuard, AgentGuard, StoreGuard],
  bootstrap: [AppComponent],
  entryComponents: [YesNoQuestionComponent, InputAreaComponent, GridDialogComponent, DynamicServerSideSearchDialogComponent,
    OrderItemsComponent, UserProductsComponent, ProductUsersComponent, CategoryItemsComponent]
})
export class AppModule { }

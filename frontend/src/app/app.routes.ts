import { Routes } from '@angular/router';
import { Home } from './pages/home/home';
import { Products } from './pages/products/products';
import { Product } from './pages/product/product';
import { Login } from './pages/login/login';
import { Register } from './pages/register/register';
import { ForgetPassword } from './pages/forget-password/forget-password';
import { Profile } from './pages/profile/profile';
import { Messages } from './pages/messages/messages';
import { Favorites } from './pages/favorites/favorites';
import { Categories } from './pages/categories/categories';
import { Category } from './pages/category/category';
import { AdminDashboard } from './pages/admin-dashboard/admin-dashboard';
import { SellerDashboard } from './pages/seller-dashboard/seller-dashboard';
import { productsResolver } from './resolvers/products.resolver';
import { productResolver } from './resolvers/product.resolver';
import { categoriesResolver } from './resolvers/categories.resolver';
import { categoryResolver } from './resolvers/category.resolver';
import { categoryProductsResolver } from './resolvers/category-products.resolver';
import { roleGuard } from './guards/role.guard';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'home', pathMatch: 'full' },
  { path: 'home', component: Home },
  { path: 'products', component: Products, resolve: { products: productsResolver } },
  { path: 'product/:id', component: Product, resolve: { product: productResolver } },
  { path: 'login', component: Login },
  { path: 'register', component: Register },
  { path: 'forget-password', component: ForgetPassword },
  { path: 'categories', component: Categories, resolve: { categories: categoriesResolver } },
  {
    path: 'category/:id',
    component: Category,
    resolve: { category: categoryResolver, products: categoryProductsResolver },
  },
  { path: 'profile', component: Profile, canActivate: [authGuard] },
  { path: 'messages', component: Messages, canActivate: [authGuard] },
  { path: 'favorites', component: Favorites },
  { path: 'admin-dashboard', component: AdminDashboard, canActivate: [roleGuard('admin')] },
  { path: 'seller-dashboard', component: SellerDashboard, canActivate: [roleGuard('seller')] },
  { path: '**', redirectTo: 'home', pathMatch: 'full' },
];

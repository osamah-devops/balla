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
import { Cart } from './pages/cart/cart';
import { CheckoutSuccess } from './pages/checkout-success/checkout-success';
import { CheckoutCancelled } from './pages/checkout-cancelled/checkout-cancelled';
import { MyOrders } from './pages/my-orders/my-orders';
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
  { path: 'home', component: Home, title: 'Balla — Marketplace' },
  { path: 'products', component: Products, resolve: { products: productsResolver }, title: 'Products · Balla' },
  { path: 'product/:id', component: Product, resolve: { product: productResolver }, title: 'Product · Balla' },
  { path: 'login', component: Login, title: 'Sign In · Balla' },
  { path: 'register', component: Register, title: 'Create Account · Balla' },
  { path: 'forget-password', component: ForgetPassword, title: 'Reset Password · Balla' },
  { path: 'categories', component: Categories, resolve: { categories: categoriesResolver }, title: 'Categories · Balla' },
  {
    path: 'category/:id',
    component: Category,
    resolve: { category: categoryResolver, products: categoryProductsResolver },
    title: 'Category · Balla',
  },
  { path: 'profile', component: Profile, canActivate: [authGuard], title: 'My Profile · Balla' },
  { path: 'messages', component: Messages, canActivate: [authGuard], title: 'Messages · Balla' },
  { path: 'favorites', component: Favorites, title: 'Favorites · Balla' },
  { path: 'cart', component: Cart, title: 'Cart · Balla' },
  { path: 'checkout/success', component: CheckoutSuccess, canActivate: [authGuard], title: 'Order Confirmed · Balla' },
  { path: 'checkout/cancelled', component: CheckoutCancelled, title: 'Checkout Cancelled · Balla' },
  { path: 'orders', component: MyOrders, canActivate: [authGuard], title: 'My Orders · Balla' },
  { path: 'admin-dashboard', component: AdminDashboard, canActivate: [roleGuard('admin')], title: 'Admin Dashboard · Balla' },
  { path: 'seller-dashboard', component: SellerDashboard, canActivate: [roleGuard('seller')], title: 'Seller Dashboard · Balla' },
  { path: '**', redirectTo: 'home', pathMatch: 'full' },
];
